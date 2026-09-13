import { BadRequestException, HttpException, HttpStatus, Injectable, ServiceUnavailableException } from "@nestjs/common";

type CachedLabel = { label: string; expiresAt: number };

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 512;
const FALLBACK_LABEL = "Location unavailable";

function formatLabel(address?: Record<string, string | undefined>, displayName?: string) {
  if (!address) return displayName || FALLBACK_LABEL;
  const locality = address.suburb || address.neighbourhood || address.city_district || address.town || address.village;
  const city = address.city || address.town || address.county || address.state_district;
  const parts = [locality, city, address.state, address.country].filter(Boolean) as string[];
  return parts.length ? Array.from(new Set(parts)).join(", ") : displayName || FALLBACK_LABEL;
}

@Injectable()
export class LocationService {
  private readonly cache = new Map<string, CachedLabel>();
  private lastUpstreamRequestAt = 0;

  async reverse(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new BadRequestException("Enter valid map coordinates");
    }

    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return { label: cached.label };
    if (cached) this.cache.delete(key);
    if (Date.now() - this.lastUpstreamRequestAt < 1000) throw new HttpException("Address lookup is busy; try again shortly", HttpStatus.TOO_MANY_REQUESTS);
    this.lastUpstreamRequestAt = Date.now();

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "16");

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Spotly-App/1.0 (contact@spotly.app)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException("Address lookup unavailable");
    }
    if (!response.ok) throw new ServiceUnavailableException("Address lookup unavailable");

    let data: { address?: Record<string, string | undefined>; display_name?: string };
    try {
      data = (await response.json()) as typeof data;
    } catch {
      throw new ServiceUnavailableException("Address lookup unavailable");
    }
    const label = formatLabel(data.address, data.display_name);
    this.cache.set(key, { label, expiresAt: Date.now() + CACHE_TTL_MS });
    // ponytail: process-local bounded cache; use shared cache only when lookup volume justifies it.
    if (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value as string);
    return { label };
  }
}

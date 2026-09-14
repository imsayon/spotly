import { BadRequestException, HttpException, HttpStatus, Injectable, ServiceUnavailableException } from "@nestjs/common";

type CachedLabel = { label: string; expiresAt: number };
type CachedSearch = { items: Array<{ label: string; latitude: number; longitude: number }>; expiresAt: number };
type PhotonFeature = { properties?: Record<string, string | undefined>; geometry?: { coordinates?: unknown } };

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

function formatPhotonLabel(properties?: Record<string, string | undefined>) {
  if (!properties) return FALLBACK_LABEL;
  const parts = [properties.name, properties.locality, properties.district, properties.city, properties.state, properties.country].filter(Boolean) as string[];
  return parts.length ? Array.from(new Set(parts)).join(", ") : FALLBACK_LABEL;
}

async function requestJson<T>(url: URL, headers?: Record<string, string>) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

@Injectable()
export class LocationService {
  private readonly cache = new Map<string, CachedLabel>();
  private readonly searchCache = new Map<string, CachedSearch>();
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
    const nominatim = await requestJson<{ address?: Record<string, string | undefined>; display_name?: string }>(url, {
      "User-Agent": "Spotly-App/1.0 (contact@spotly.app)",
      "Accept-Language": "en",
    });
    let label = nominatim ? formatLabel(nominatim.address, nominatim.display_name) : FALLBACK_LABEL;
    if (label === FALLBACK_LABEL) {
      const photonUrl = new URL("https://photon.komoot.io/reverse");
      photonUrl.searchParams.set("lat", String(latitude));
      photonUrl.searchParams.set("lon", String(longitude));
      photonUrl.searchParams.set("limit", "1");
      const photon = await requestJson<{ features?: PhotonFeature[] }>(photonUrl);
      label = formatPhotonLabel(photon?.features?.[0]?.properties);
    }
    if (label === FALLBACK_LABEL) throw new ServiceUnavailableException("Address lookup unavailable");
    this.cache.set(key, { label, expiresAt: Date.now() + CACHE_TTL_MS });
    // ponytail: process-local bounded cache; use shared cache only when lookup volume justifies it.
    if (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value as string);
    return { label };
  }

  async search(rawQuery: string) {
    const query = rawQuery?.trim();
    if (!query || query.length < 2 || query.length > 120) {
      throw new BadRequestException("Enter at least 2 characters to search for a place");
    }
    const key = query.toLowerCase();
    const cached = this.searchCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return { items: cached.items };
    if (cached) this.searchCache.delete(key);
    if (Date.now() - this.lastUpstreamRequestAt < 1000) throw new HttpException("Address lookup is busy; try again shortly", HttpStatus.TOO_MANY_REQUESTS);
    this.lastUpstreamRequestAt = Date.now();

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");
    const nominatim = await requestJson<Array<{ display_name?: string; lat?: string; lon?: string }>>(url, {
      "User-Agent": "Spotly-App/1.0 (contact@spotly.app)",
      "Accept-Language": "en",
    });
    let items = (nominatim || [])
      .map((item) => ({ label: item.display_name?.trim() || "Selected area", latitude: Number(item.lat), longitude: Number(item.lon) }))
      .filter((item) => item.label && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90 && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180);
    if (!items.length) {
      const photonUrl = new URL("https://photon.komoot.io/api/");
      photonUrl.searchParams.set("q", query);
      photonUrl.searchParams.set("limit", "5");
      const photon = await requestJson<{ features?: PhotonFeature[] }>(photonUrl);
      items = (photon?.features || [])
        .map((feature) => {
          const coordinates = feature.geometry?.coordinates;
          const longitude = Array.isArray(coordinates) ? Number(coordinates[0]) : Number.NaN;
          const latitude = Array.isArray(coordinates) ? Number(coordinates[1]) : Number.NaN;
          return { label: formatPhotonLabel(feature.properties), latitude, longitude };
        })
        .filter((item) => item.label !== FALLBACK_LABEL && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90 && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180);
    }
    this.searchCache.set(key, { items, expiresAt: Date.now() + CACHE_TTL_MS });
    if (this.searchCache.size > CACHE_LIMIT) this.searchCache.delete(this.searchCache.keys().next().value as string);
    return { items };
  }
}

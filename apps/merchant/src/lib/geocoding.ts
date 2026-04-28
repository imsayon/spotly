export const FALLBACK_LABEL = "Location unavailable";

export interface NominatimResponse {
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    town?: string;
    village?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  display_name?: string;
}

function formatLocationLabel(address?: NominatimResponse['address']): string {
  if (!address) return FALLBACK_LABEL;

  const locality =
    address.suburb || address.neighbourhood || address.city_district || address.town || address.village;
  const city = address.city || address.town || address.county || address.state_district;
  const state = address.state;
  const country = address.country;

  // If we have a suburb/locality and a city, that's usually enough for a nice label
  if (locality && city) return `${locality}, ${city}`;

  const parts = [locality, city, state, country].filter(Boolean);
  if (parts.length === 0) return (address as any).display_name || FALLBACK_LABEL;

  return Array.from(new Set(parts)).join(", ");
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "16");

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Spotly-Merchant-App/1.0 (contact@spotly.app)',
        'Accept-Language': 'en'
      }
    });
    
    if (!res.ok) {
      console.warn('Nominatim reverse geocode failed:', res.status);
      return FALLBACK_LABEL;
    }

    const data: NominatimResponse = await res.json();
    return formatLocationLabel(data.address) || data.display_name || FALLBACK_LABEL;
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return FALLBACK_LABEL;
  }
}

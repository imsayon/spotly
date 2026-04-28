export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function requestBrowserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

export async function reverseGeocodeLocation({ latitude, longitude }: Coordinates): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await res.json();
  const address = data?.address ?? {};
  const area = address.city || address.town || address.village || address.suburb || address.county;
  const state = address.state || address.region;
  const country = address.country;

  const parts = [area, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location detected';
}
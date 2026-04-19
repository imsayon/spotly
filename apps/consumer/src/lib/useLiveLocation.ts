"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Coordinates = { latitude: number; longitude: number };

type LocationState = {
  locationText: string;
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  isDenied: boolean;
  refresh: () => void;
};

const CACHE_KEY = "consumer.live.location.v1";

function readCache() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as {
      locationText: string;
      coordinates: Coordinates;
    };
  } catch {
    return null;
  }
}

function writeCache(locationText: string, coordinates: Coordinates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify({ locationText, coordinates }));
}

async function reverseGeocode({ latitude, longitude }: Coordinates): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = await res.json();
  const address = data?.address ?? {};
  const area = address.city || address.town || address.village || address.suburb || address.county;
  const state = address.state || address.region;
  const country = address.country;

  const parts = [area, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location detected";
}

export function useLiveLocation(): LocationState {
  const cached = useMemo(() => readCache(), []);
  const [locationText, setLocationText] = useState<string>(cached?.locationText ?? "Detecting location...");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(cached?.coordinates ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDenied, setIsDenied] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const updateFromCoords = useCallback(async (coords: Coordinates) => {
    setCoordinates(coords);

    try {
      const text = await reverseGeocode(coords);
      setLocationText(text);
      setError(null);
      writeCache(text, coords);
    } catch {
      setError("Could not resolve your exact address");
      setLocationText("Location detected");
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported on this device");
      return;
    }

    setLoading(true);
    setError(null);
    setIsDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        await updateFromCoords(next);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setIsDenied(true);
          setError("Location permission is required for precise nearby results");
        } else {
          setError("Could not fetch current location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [updateFromCoords]);

  useEffect(() => {
    request();
  }, [request]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateFromCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        // Keep existing location if live updates fail.
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateFromCoords]);

  return {
    locationText,
    coordinates,
    loading,
    error,
    isDenied,
    refresh: request,
  };
}

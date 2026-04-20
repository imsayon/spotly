"use client"

import { useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "spotly.consumer.live-location"
const LOCATION_EVENT = "spotly:location-updated"

export interface LiveLocationSnapshot {
  latitude: number
  longitude: number
  accuracy: number | null
  label: string
  updatedAt: number
}

interface UseLiveLocationOptions {
  prompt?: boolean
  watch?: boolean
}

type GeoPermission = "unknown" | "granted" | "denied" | "prompt" | "unsupported"

interface NominatimResponse {
  address?: Record<string, string>
}

const FALLBACK_LABEL = "Location unavailable"

function formatLocationLabel(address?: Record<string, string>): string {
  if (!address) return FALLBACK_LABEL

  const locality =
    address.suburb || address.neighbourhood || address.city_district || address.town || address.village
  const city = address.city || address.town || address.county || address.state_district
  const state = address.state
  const country = address.country

  const parts = [locality, city, state, country].filter(Boolean)
  if (parts.length === 0) return FALLBACK_LABEL

  return Array.from(new Set(parts)).join(", ")
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("lat", String(latitude))
    url.searchParams.set("lon", String(longitude))
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("zoom", "16")

    const res = await fetch(url.toString())
    if (!res.ok) return FALLBACK_LABEL

    const data: NominatimResponse = await res.json()
    return formatLocationLabel(data.address)
  } catch {
    return FALLBACK_LABEL
  }
}

function readCachedLocation(): LiveLocationSnapshot | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LiveLocationSnapshot
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null
    return parsed
  } catch {
    return null
  }
}

function saveLocation(snapshot: LiveLocationSnapshot) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  window.dispatchEvent(new CustomEvent<LiveLocationSnapshot>(LOCATION_EVENT, { detail: snapshot }))
}

export function useLiveLocation(options: UseLiveLocationOptions = {}) {
  const { prompt = false, watch = false } = options

  const [location, setLocation] = useState<LiveLocationSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<GeoPermission>("unknown")
  const [requestTick, setRequestTick] = useState(0)

  const requestLocation = () => setRequestTick((v) => v + 1)

  useEffect(() => {
    const cached = readCachedLocation()
    if (cached) setLocation(cached)

    const onLocationUpdated = (event: Event) => {
      const custom = event as CustomEvent<LiveLocationSnapshot>
      if (custom.detail) setLocation(custom.detail)
    }

    window.addEventListener(LOCATION_EVENT, onLocationUpdated as EventListener)
    return () => window.removeEventListener(LOCATION_EVENT, onLocationUpdated as EventListener)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("geolocation" in navigator)) {
      setPermissionStatus("unsupported")
      return
    }

    const navWithPermissions = navigator as Navigator & {
      permissions?: {
        query: (descriptor: PermissionDescriptor) => Promise<PermissionStatus>
      }
    }

    if (!navWithPermissions.permissions?.query) {
      setPermissionStatus("unknown")
      return
    }

    let mounted = true
    let detach: (() => void) | null = null

    navWithPermissions.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!mounted) return
        setPermissionStatus(status.state as GeoPermission)
        const onChange = () => setPermissionStatus(status.state as GeoPermission)
        status.addEventListener("change", onChange)
        detach = () => status.removeEventListener("change", onChange)
      })
      .catch(() => {
        if (mounted) setPermissionStatus("unknown")
      })

    return () => {
      mounted = false
      if (detach) detach()
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!prompt && requestTick === 0) return
    if (!("geolocation" in navigator)) {
      setPermissionStatus("unsupported")
      setError("Geolocation is not supported in this browser")
      return
    }

    let watchId: number | null = null
    let isMounted = true

    const updateFromPosition = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      const label = await reverseGeocode(latitude, longitude)

      const snapshot: LiveLocationSnapshot = {
        latitude,
        longitude,
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
        label,
        updatedAt: Date.now(),
      }

      if (!isMounted) return
      setLocation(snapshot)
      saveLocation(snapshot)
      setPermissionStatus("granted")
      setError(null)
      setLoading(false)
    }

    const handleError = (geoError: GeolocationPositionError) => {
      if (!isMounted) return
      if (geoError.code === 1) {
        setPermissionStatus("denied")
      }
      setLoading(false)
      setError(geoError.message || "Unable to fetch your location")
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(updateFromPosition, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    })

    if (prompt && watch) {
      watchId = navigator.geolocation.watchPosition(updateFromPosition, handleError, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      })
    }

    return () => {
      isMounted = false
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [prompt, watch, requestTick])

  const label = useMemo(() => location?.label || FALLBACK_LABEL, [location?.label])

  return {
    location,
    label,
    loading,
    error,
    permissionStatus,
    isDenied: permissionStatus === "denied",
    requestLocation,
  }
}

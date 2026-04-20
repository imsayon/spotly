"use client"

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface MapPickerProps {
  lat?: number
  lng?: number
  onSelect: (lat: number, lng: number, address?: string) => void
  zoom?: number
}

// Simple reverse geocoding to get a label
async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=16`
    const res = await fetch(url)
    if (!res.ok) return "Selected Area"
    const data = await res.json()
    const address = data.address
    const locality = address.suburb || address.neighbourhood || address.city_district || address.town || address.village
    const city = address.city || address.town || address.county
    return locality ? `${locality}, ${city}` : city || "Selected Area"
  } catch {
    return "Selected Area"
  }
}

function LocationMarker({ lat, lng, onSelect }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    lat && lng ? L.latLng(lat, lng) : null
  )

  useMapEvents({
    async click(e) {
      setPosition(e.latlng)
      const label = await reverseGeocode(e.latlng.lat, e.latlng.lng)
      onSelect(e.latlng.lat, e.latlng.lng, label)
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

export default function MapPicker({ lat, lng, onSelect, zoom = 13 }: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    fixLeafletIcons()
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div style={{ height: '300px', background: 'rgba(255,255,255,.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>

  const center: L.LatLngExpression = lat && lng ? [lat, lng] : [12.9716, 77.5946] // Default to Bengaluru

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onSelect={onSelect} />
      </MapContainer>
    </div>
  )
}

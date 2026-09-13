"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
	// @ts-ignore
	delete L.Icon.Default.prototype._getIconUrl
	L.Icon.Default.mergeOptions({
		iconRetinaUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
		iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
		shadowUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	})
}

interface MapPickerProps {
	lat?: number
	lng?: number
	onSelect: (lat: number, lng: number, address?: string) => void
	zoom?: number
}

import { reverseGeocode } from "@/lib/geocoding"

function LocationMarker({ lat, lng, onSelect }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat as number, lng as number) : null,
  )
	const selection = useRef(0)

	useEffect(() => {
		setPosition(Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat as number, lng as number) : null)
	}, [lat, lng])

	const select = async (next: L.LatLng) => {
		const request = ++selection.current
		setPosition(next)
		const label = await reverseGeocode(next.lat, next.lng)
		if (request === selection.current) onSelect(next.lat, next.lng, label)
	}

	useMapEvents({
		click(e) {
			void select(e.latlng)
		},
	})

	return position === null ? null : (
		<Marker
			position={position}
			draggable
			eventHandlers={{ dragend: (event) => void select((event.target as L.Marker).getLatLng()) }}
		/>
	)
}

function SyncMap({ lat, lng }: Pick<MapPickerProps, "lat" | "lng">) {
	const map = useMap()
	useEffect(() => {
		if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat as number, lng as number])
	}, [lat, lng, map])
	return null
}

export default function MapPicker({
	lat,
	lng,
	onSelect,
	zoom = 13,
}: MapPickerProps) {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		fixLeafletIcons()
		setIsMounted(true)
	}, [])

	if (!isMounted)
		return (
			<div
				style={{
					height: "300px",
					background: "rgba(255,255,255,.05)",
					borderRadius: 12,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				Loading map...
			</div>
		)

	const center: L.LatLngExpression =
		Number.isFinite(lat) && Number.isFinite(lng) ? [lat as number, lng as number] : [12.9716, 77.5946] // Default to Bengaluru

	return (
		<div
			style={{
				height: "300px",
				width: "100%",
				borderRadius: 12,
				overflow: "hidden",
				border: "1px solid rgba(255,255,255,.12)",
			}}
		>
			<MapContainer
				center={center}
				zoom={zoom}
				scrollWheelZoom={true}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<SyncMap lat={lat} lng={lng} />
				<LocationMarker lat={lat} lng={lng} onSelect={onSelect} />
			</MapContainer>
		</div>
	)
}

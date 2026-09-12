"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

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

interface MapDiscoveryProps {
	merchants: any[]
	center?: [number, number]
	zoom?: number
	onSelect: (merchant: any) => void
	userLocation?: [number, number]
}

function MapResizer() {
	const map = useMap()
	useEffect(() => {
		setTimeout(() => map.invalidateSize(), 100)
	}, [map])
	return null
}

function RecenterMap({ center }: { center?: [number, number] }) {
	const map = useMap()

	useEffect(() => {
		if (center) {
			map.setView(center)
		}
	}, [map, center])

	return null
}

function FitMarkers({ merchants, center }: { merchants: any[]; center?: [number, number] }) {
	const map = useMap()

	useEffect(() => {
		const points: [number, number][] = merchants.flatMap((merchant) => {
			const pins: [number, number][] = []
			if (Number.isFinite(merchant.lat) && Number.isFinite(merchant.lng)) pins.push([merchant.lat, merchant.lng])
			merchant.outlets?.forEach((outlet: any) => {
				if (Number.isFinite(outlet.lat) && Number.isFinite(outlet.lng)) pins.push([outlet.lat, outlet.lng])
			})
			return pins
		})
		if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 13 })
		else if (points[0]) map.setView(points[0])
		else if (center) map.setView(center)
	}, [center, map, merchants])

	return null
}

export default function MapDiscovery({
	merchants,
	center = [12.9716, 77.5946],
	zoom = 13,
	onSelect,
	userLocation,
}: MapDiscoveryProps) {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		fixLeafletIcons()
		setIsMounted(true)
	}, [])

	if (!isMounted)
		return (
			<div
				style={{
					height: "400px",
						background: "var(--surface-subtle, #EEE6DA)",
						borderRadius: 8,
						border: "1px solid var(--border, #D8CFC2)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				Loading Experience...
			</div>
		)

	return (
		<div
			style={{
				height: "min(560px, 62vh)",
				width: "100%",
				borderRadius: 8,
				overflow: "hidden",
				border: "1px solid var(--border, #D8CFC2)",
				position: "relative",
			}}
		>
			<MapContainer
				center={center}
				zoom={zoom}
				scrollWheelZoom={true}
				style={{ height: "100%", width: "100%", background: "var(--surface-subtle, #EEE6DA)" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapResizer />
				<RecenterMap center={center} />
				<FitMarkers merchants={merchants} center={center} />
				{userLocation && (
					<Marker position={userLocation}>
						<Popup>
							<div style={{ color: "#000", fontWeight: 700 }}>
								You are here
							</div>
						</Popup>
					</Marker>
				)}
				{merchants.map((m) => {
					// Collect all pins (main location + outlets)
					const pins: any[] = []
					if (Number.isFinite(m.lat) && Number.isFinite(m.lng))
						pins.push({
							lat: m.lat,
							lng: m.lng,
							label: m.name,
							isMain: true,
						})
					if (m.outlets) {
						m.outlets.forEach((o: any) => {
							if (
								Number.isFinite(o.lat) &&
								Number.isFinite(o.lng)
							)
								pins.push({
									lat: o.lat,
									lng: o.lng,
									label: `${m.name} - ${o.name}`,
									id: o.id,
								})
						})
					}

					return pins.map((p, idx) => (
						<Marker
							key={`${m.id}-${idx}`}
							position={[p.lat, p.lng]}
							eventHandlers={{
								click: () => onSelect(m),
							}}
						>
							<Popup className="spotly-popup">
								<div style={{ color: "#000", padding: "4px" }}>
									<div
										style={{
											fontWeight: 800,
											fontSize: 13,
										}}
									>
										{p.label}
									</div>
									<div
										style={{
											fontSize: 11,
											color: "#666",
											marginTop: 2,
										}}
									>
										{m.category}
									</div>
									<button
										style={{
											marginTop: 8,
										background: "var(--brand, #B34C35)",
											color: "#fff",
											border: "none",
											padding: "4px 10px",
											borderRadius: 6,
											fontSize: 10,
											fontWeight: 700,
											cursor: "pointer",
										}}
										onClick={() => onSelect(m)}
									>
										View Details
									</button>
								</div>
							</Popup>
						</Marker>
					))
				})}
			</MapContainer>
		</div>
	)
}

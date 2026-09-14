"use client"

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

export interface DiscoveryMapOutlet {
	id: string
	merchantId: string
	name: string
	address?: string | null
	lat?: number | null
	lng?: number | null
	isActive?: boolean
	distanceMeters?: number | null
	merchant: {
		name: string
		category?: string | null
		logoUrl?: string | null
	}
}

interface MapDiscoveryProps {
	outlets: DiscoveryMapOutlet[]
	center?: [number, number]
	zoom?: number
	selectedId?: string
	onSelect: (outlet: DiscoveryMapOutlet) => void
	onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
	userLocation?: [number, number]
	userAccuracy?: number | null
}

const categoryGlyph = (category?: string | null) => {
	const normalized = category?.toLowerCase() || ""
	if (normalized.includes("food") || normalized.includes("beverage") || normalized.includes("restaurant")) {
		return '<path d="M8 3v7m3-7v7M6 3v5a2 2 0 0 0 2 2m3-7v16M6 13h5"/>'
	}
	if (normalized.includes("retail") || normalized.includes("shop")) {
		return '<path d="M4 8h16l-1-4H5L4 8Zm1 0v10h14V8M9 18v-5h6v5M3 8h18"/>'
	}
	if (normalized.includes("health") || normalized.includes("clinic")) {
		return '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10Zm0-10v5m-2.5-2.5h5"/>'
	}
	return '<path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M3 20h18"/>'
}

function outletIcon(category: string | null | undefined, selected: boolean) {
	return L.divIcon({
		className: "spotly-map-div-icon",
		html: `<span class="spotly-map-pin${selected ? " is-selected" : ""}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${categoryGlyph(category)}</svg></span>`,
		iconSize: [44, 48],
		iconAnchor: [22, 43],
		popupAnchor: [0, -42],
	})
}

const userIcon = L.divIcon({
	className: "spotly-user-div-icon",
	html: '<span class="spotly-user-pin" aria-hidden="true"><span></span></span>',
	iconSize: [22, 22],
	iconAnchor: [11, 11],
})

function MapResizer() {
	const map = useMap()
	useEffect(() => {
		const timer = window.setTimeout(() => map.invalidateSize(), 100)
		return () => window.clearTimeout(timer)
	}, [map])
	return null
}

function MapViewport({ center, suppressNextMove }: Pick<MapDiscoveryProps, "center"> & { suppressNextMove: MutableRefObject<boolean> }) {
	const map = useMap()
	const lastCenter = useRef<string>(center?.join(",") || "")

	useEffect(() => {
		if (!center) return
		const key = center.join(",")
		if (lastCenter.current === key) return
		lastCenter.current = key
		suppressNextMove.current = true
		map.flyTo(center, Math.max(map.getZoom(), 12), { duration: 0.55 })
	}, [center, map, suppressNextMove])
	return null
}

function MapInteraction({ onBoundsChange, suppressNextMove }: Pick<MapDiscoveryProps, "onBoundsChange"> & { suppressNextMove: MutableRefObject<boolean> }) {
	useMapEvents({
		moveend(event) {
			if (!onBoundsChange) return
			if (suppressNextMove.current) {
				suppressNextMove.current = false
				return
			}
			const bounds = event.target.getBounds() as L.LatLngBounds
			onBoundsChange({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() })
		},
	})
	return null
}

function formatDistance(distanceMeters?: number | null) {
	if (!Number.isFinite(distanceMeters)) return null
	return distanceMeters! < 1000 ? `${Math.round(distanceMeters!)} m away` : `${(distanceMeters! / 1000).toFixed(1)} km away`
}

export default function MapDiscovery({
	outlets,
	center = [12.9716, 77.5946],
	zoom = 13,
	selectedId,
	onSelect,
	onBoundsChange,
	userLocation,
	userAccuracy,
}: MapDiscoveryProps) {
	const [isMounted, setIsMounted] = useState(false)
	const suppressNextMove = useRef(false)
	useEffect(() => setIsMounted(true), [])

	const mappedOutlets = useMemo(
		() => outlets.filter((outlet) => Number.isFinite(outlet.lat) && Number.isFinite(outlet.lng)),
		[outlets],
	)

	if (!isMounted) return <div className="consumer-map-loading">Loading map…</div>

	return (
		<div className="consumer-map-canvas">
			<div className="consumer-map-legend" aria-hidden="true">
				<span><i className="consumer-map-legend-dot" /> You</span>
				<span><i className="consumer-map-legend-pin" /> Outlet</span>
			</div>
			<MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: "100%", width: "100%", background: "var(--surface-raised)" }}>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapResizer />
				<MapViewport center={center} suppressNextMove={suppressNextMove} />
				<MapInteraction onBoundsChange={onBoundsChange} suppressNextMove={suppressNextMove} />
				{userLocation ? (
					<>
						<Circle center={userLocation} radius={Math.min(Math.max(userAccuracy || 80, 30), 1000)} pathOptions={{ color: "var(--brand)", fillColor: "var(--brand)", fillOpacity: 0.08, weight: 1 }} />
						<Marker position={userLocation} icon={userIcon}><Popup><strong>You are here</strong>{userAccuracy ? <div>Approx. ±{Math.round(userAccuracy)} m</div> : null}</Popup></Marker>
					</>
				) : null}
				{mappedOutlets.map((outlet) => (
					<Marker
						key={outlet.id}
						position={[outlet.lat as number, outlet.lng as number]}
						icon={outletIcon(outlet.merchant.category, outlet.id === selectedId)}
						eventHandlers={{ click: () => onSelect(outlet) }}
					>
						<Popup className="spotly-popup">
							<div className="spotly-popup-content">
								<div className="consumer-kicker">{outlet.merchant.category || "Everyday services"}</div>
								<strong>{outlet.merchant.name}</strong>
								<span>{outlet.name}</span>
								{outlet.address ? <small>{outlet.address}</small> : null}
								{formatDistance(outlet.distanceMeters) ? <small className="spotly-popup-distance">{formatDistance(outlet.distanceMeters)}</small> : null}
								{outlet.isActive === false ? <small className="spotly-popup-paused">Requests paused</small> : null}
								<a className="spotly-popup-action" href={`/merchant?id=${encodeURIComponent(outlet.merchantId)}&outletId=${encodeURIComponent(outlet.id)}`} onClick={() => onSelect(outlet)}>View details <span aria-hidden="true">↗</span></a>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	)
}

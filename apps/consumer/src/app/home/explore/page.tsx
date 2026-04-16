"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME, SkeletonCard } from "@spotly/ui"
import { useLocationStore } from "@/store/location.store"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Icon, LatLngTuple } from "leaflet"
import api from "@/lib/api"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

const s = {
	glassStrong: {
		background: "rgba(255,255,255,.07)",
		backdropFilter: "blur(32px)",
		WebkitBackdropFilter: "blur(32px)",
		border: "1px solid var(--bdr2)",
	},
	card: {
		background: "var(--s1)",
		border: "1px solid var(--bdr)",
		borderRadius: 18,
		padding: 22,
		transition: "all .3s cubic-bezier(.25,.46,.45,.94)",
	},
	gradCText: {
		background: "linear-gradient(135deg,#f5c418,#ff6316)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
	},
	btnC: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		padding: "12px 20px",
		borderRadius: 999,
		background: "var(--gC)",
		color: "#000",
		fontWeight: 800,
		fontSize: 13,
		border: "none",
		cursor: "pointer",
		transition: "all .25s",
		boxShadow: "0 8px 20px rgba(245,196,24,.3)",
	},
	badge: (c: string) => ({
		display: "inline-flex",
		alignItems: "center",
		gap: 4,
		padding: "3px 9px",
		borderRadius: 999,
		fontSize: 11,
		fontWeight: 700,
		letterSpacing: 0.3,
		...(c === "yellow" && {
			background: "rgba(245,196,24,.12)",
			color: "#f5c418",
			border: "1px solid rgba(245,196,24,.22)",
		}),
		...(c === "gray" && {
			background: "rgba(255,255,255,.07)",
			color: "rgba(255,255,255,.5)",
			border: "1px solid var(--bdr)",
		}),
		...(c === "cyan" && {
			background: "rgba(0,207,255,.1)",
			color: "#00cfff",
			border: "1px solid rgba(0,207,255,.2)",
		}),
	}),
}

// Custom marker icon
const createCustomIcon = (isSelected: boolean) => {
	const stroke = isSelected ? "#fff" : "rgba(255,255,255,0.3)"
	const strokeWidth = isSelected ? 3 : 2
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
		<circle cx="18" cy="18" r="16" fill="#f5c418" stroke="${stroke}" stroke-width="${strokeWidth}"/>
		<text x="18" y="22" text-anchor="middle" font-size="16">🏪</text>
	</svg>`
	return new Icon({
		iconUrl: `data:image/svg+xml;base64,${typeof window !== "undefined" ? btoa(svg) : ""}`,
		iconSize: [36, 36],
		iconAnchor: [18, 18],
		popupAnchor: [0, -18],
	})
}

// Map center controller component
function MapController({ center }: { center: LatLngTuple }) {
	const map = useMap()
	useEffect(() => {
		map.setView(center, 14)
	}, [center, map])
	return null
}

// Merchant Popup Content
function MerchantPopup({
	merchant,
	onView,
}: {
	merchant: any
	onView: () => void
}) {
	const waitTime = merchant.currentQueueDepth * 5

	return (
		<div className="min-w-[200px]">
			<h3 className="font-bold text-white text-base mb-1">
				{merchant.name}
			</h3>
			<p className="text-xs text-gray-400 mb-2">{merchant.category}</p>
			<div className="flex items-center gap-2 mb-3">
				<span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
					{merchant.currentQueueDepth} waiting
				</span>
				<span className="text-xs text-yellow-300">~{waitTime} min</span>
			</div>
			<button
				onClick={onView}
				className="w-full py-2 px-3 rounded-lg bg-gradient-brand text-black text-xs font-bold"
			>
				Get Token
			</button>
		</div>
	)
}

export default function ConsumerExplore() {
	const router = useRouter()
	const { add: addToast } = useToasts()
	const { coords, permissionGranted } = useLocationStore()

	const [view, setView] = useState<"map" | "list">("map")
	const [selected, setSelected] = useState<any>(null)
	const [merchants, setMerchants] = useState<any[]>([])
	const [favorites, setFavorites] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)

	// Default center (Bangalore)
	const defaultCenter: LatLngTuple = [12.9716, 77.5946]
	const mapCenter: LatLngTuple = coords
		? [coords.lat, coords.lon]
		: defaultCenter

	useEffect(() => {
		fetchData()
	}, [coords])

	const fetchData = async () => {
		setLoading(true)
		try {
			// Fetch merchants with location and queue data
			let url = "/merchant?"
			if (coords) {
				url += `lat=${coords.lat}&lon=${coords.lon}`
			}

			const [mRes, fRes] = await Promise.all([
				api.get(url),
				api.get("/user/favorites"),
			])

			// Flatten merchants with outlet coordinates
			const merchantsWithCoords = mRes.data.data
				?.flatMap(
					(m: any) =>
						m.outlets?.map((o: any) => ({
							...m,
							outletId: o.id,
							outletName: o.name,
							lat: o.lat,
							lng: o.lng,
							address: o.address,
							isActive: o.isActive,
						})) || [],
				)
				.filter((m: any) => m.lat && m.lng)

			setMerchants(merchantsWithCoords)
			setFavorites(
				new Set(fRes.data.data.map((fav: any) => fav.merchantId)),
			)
		} catch (err) {
			console.error("Fetch explore failed:", err)
			addToast("Failed to load nearby places", "error")
		} finally {
			setLoading(false)
		}
	}

	const toggleFav = async (merchantId: string, e?: React.MouseEvent) => {
		if (e) e.stopPropagation()
		const isFav = favorites.has(merchantId)

		// Optimistic update
		setFavorites((prev) => {
			const n = new Set(prev)
			if (isFav) n.delete(merchantId)
			else n.add(merchantId)
			return n
		})

		try {
			if (isFav) {
				await api.delete(`/user/favorites/${merchantId}`)
				addToast("Removed from favorites", "info")
			} else {
				await api.post("/user/favorites", { merchantId })
				addToast("Added to favorites ❤️", "success")
			}
		} catch (err) {
			// Rollback
			setFavorites((prev) => {
				const n = new Set(prev)
				if (isFav) n.add(merchantId)
				else n.delete(merchantId)
				return n
			})
			addToast("Sync failed", "error")
		}
	}

	// Map markers
	const markers = useMemo(() => {
		return merchants.map((m) => (
			<Marker
				key={`${m.id}-${m.outletId}`}
				position={[m.lat, m.lng] as LatLngTuple}
				icon={createCustomIcon(selected?.outletId === m.outletId)}
				eventHandlers={{
					click: () =>
						setSelected(
							selected?.outletId === m.outletId ? null : m,
						),
				}}
			>
				<Popup>
					<MerchantPopup
						merchant={m}
						onView={() => router.push(`/merchant/${m.id}`)}
					/>
				</Popup>
			</Marker>
		))
	}, [merchants, selected, router])

	return (
		<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
			<h1
				style={{
					fontFamily: "var(--font-sans)",
					fontSize: 24,
					fontWeight: 900,
					marginBottom: 16,
				}}
			>
				Explore{" "}
				<span style={s.gradCText as React.CSSProperties}>Nearby</span>
			</h1>

			{/* View Toggle */}
			<div
				style={{
					display: "flex",
					gap: 3,
					background: "rgba(255,255,255,.04)",
					padding: 3,
					borderRadius: 11,
					marginBottom: 18,
					border: "1px solid var(--bdr)",
				}}
			>
				{[
					{ v: "map", l: "🗺 Map" },
					{ v: "list", l: "📋 List" },
				].map(({ v, l }) => (
					<button
						key={v}
						onClick={() => setView(v as "map" | "list")}
						style={{
							flex: 1,
							padding: "9px",
							borderRadius: 9,
							border: "none",
							background:
								view === v
									? "rgba(255,255,255,.1)"
									: "transparent",
							color: view === v ? "#fff" : "var(--t3)",
							fontWeight: 700,
							fontSize: 13,
							cursor: "pointer",
							fontFamily: "var(--font-sans)",
							transition: "all .2s",
						}}
					>
						{l}
					</button>
				))}
			</div>

			{/* Location Status */}
			{!coords && (
				<div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center gap-2">
					<Ic.MapPin className="w-4 h-4" />
					{permissionGranted
						? "Locating you..."
						: "Enable location for accurate results"}
				</div>
			)}

			{loading ? (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 12,
					}}
				>
					<SkeletonCard height={80} />
					<SkeletonCard height={80} />
					<SkeletonCard height={80} />
				</div>
			) : view === "map" ? (
				<>
					{/* Leaflet Map */}
					<div className="h-[400px] rounded-2xl overflow-hidden border border-white/10 relative">
						<MapContainer
							center={mapCenter}
							zoom={14}
							style={{
								height: "100%",
								width: "100%",
								background: "#0a0a0a",
							}}
							zoomControl={false}
						>
							<TileLayer
								attribution='&copy; <a href="https://carto.com/">CARTO</a>'
								url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
							/>
							<MapController center={mapCenter} />
							{markers}
						</MapContainer>

						{/* Location Badge */}
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400">
							📍 {coords ? "Your location" : "Bengaluru, India"}
						</div>
					</div>

					{/* Selected Merchant Bottom Sheet */}
					<AnimatePresence>
						{selected && (
							<motion.div
								initial={{ y: 100, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 100, opacity: 0 }}
								className="fixed bottom-0 left-0 right-0 p-4 z-50"
							>
								<div className="max-w-md mx-auto bg-surface border border-border rounded-2xl p-4 shadow-2xl">
									<div className="flex items-center gap-3 mb-3">
										<div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl">
											🏪
										</div>
										<div className="flex-1">
											<h3 className="font-bold text-white">
												{selected.name}
											</h3>
											<p className="text-xs text-gray-400">
												{selected.outletName}
											</p>
										</div>
										<button
											onClick={() => setSelected(null)}
											className="p-2 rounded-lg hover:bg-white/5"
										>
											<Ic.X className="w-5 h-5 text-gray-400" />
										</button>
									</div>
									<p className="text-sm text-gray-400 mb-3">
										{selected.address}
									</p>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
												{selected.currentQueueDepth}{" "}
												waiting
											</span>
											<span className="text-xs text-yellow-300">
												~
												{selected.currentQueueDepth * 5}{" "}
												min
											</span>
										</div>
										<button
											onClick={() =>
												router.push(
													`/merchant/${selected.id}`,
												)
											}
											className="px-4 py-2 rounded-xl bg-gradient-brand text-black text-sm font-bold"
										>
											View
										</button>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</>
			) : (
				/* List View */
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					{merchants.length > 0 ? (
						merchants.map((m) => (
							<div
								key={`${m.id}-${m.outletId}`}
								style={{
									...s.card,
									padding: "14px",
									display: "flex",
									alignItems: "center",
									gap: 12,
									cursor: "pointer",
								}}
								className="hover:border-[#f5c41840] hover:translate-x-1 transition-all"
								onClick={() => router.push(`/merchant/${m.id}`)}
							>
								<div
									style={{
										width: 50,
										height: 50,
										borderRadius: 13,
										background: "rgba(245,196,24,.1)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 26,
										flexShrink: 0,
									}}
								>
									🏪
								</div>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontWeight: 700,
											fontSize: 15,
											marginBottom: 2,
										}}
									>
										{m.name}
									</div>
									<div
										style={{
											fontSize: 12,
											color: "var(--t3)",
											marginBottom: 6,
										}}
									>
										{m.category} · {m.outletName}
									</div>
									<div style={{ display: "flex", gap: 7 }}>
										<span
											style={{
												...(s.badge(
													"yellow",
												) as React.CSSProperties),
												fontSize: 10,
											}}
										>
											⏱ {m.currentQueueDepth} waiting
										</span>
										{m.isActive ? (
											<span
												style={{
													...(s.badge(
														"cyan",
													) as React.CSSProperties),
													fontSize: 10,
												}}
											>
												Open
											</span>
										) : (
											<span
												style={{
													...(s.badge(
														"gray",
													) as React.CSSProperties),
													fontSize: 10,
												}}
											>
												Closed
											</span>
										)}
									</div>
								</div>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 8,
									}}
								>
									<div
										onClick={(e) => toggleFav(m.id, e)}
										className="hover:scale-110 active:scale-95 transition-transform"
									>
										<Ic.Heart f={favorites.has(m.id)} />
									</div>
									<Ic.ChevR />
								</div>
							</div>
						))
					) : (
						<div
							style={{
								padding: "40px",
								textAlign: "center",
								color: "var(--t3)",
							}}
						>
							No outlets found nearby
						</div>
					)}
				</div>
			)}
		</div>
	)
}

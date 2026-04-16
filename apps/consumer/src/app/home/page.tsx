"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useLocationStore } from "@/store/location.store"
import { GeolocationPrompt } from "@/components/GeolocationPrompt"
import api from "@/lib/api"
import { s } from "./home.styles"

// Category definitions with emojis
const CATEGORIES = [
	{ id: 'all', label: 'All', emoji: '✨' },
	{ id: 'coffee', label: 'Coffee', emoji: '☕' },
	{ id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
	{ id: 'bakery', label: 'Bakery', emoji: '🥐' },
	{ id: 'grocery', label: 'Grocery', emoji: '🛒' },
	{ id: 'health', label: 'Health', emoji: '🏥' },
	{ id: 'salon', label: 'Salon', emoji: '💈' },
	{ id: 'finance', label: 'Finance', emoji: '🏦' },
	{ id: 'dining', label: 'Dining', emoji: '🍽️' },
]

// Filter pill types
const FILTER_PILLS = [
	{ id: 'open', label: 'Open now', filter: (m: any) => m.outlets?.some((o: any) => o.isActive) },
	{ id: 'short', label: 'Short wait', filter: (m: any) => m.currentQueueDepth < 5 },
] as const

// Urgency Hero Card Component
function UrgencyHeroCard({ merchant, distance, onJoin }: { merchant: any; distance: number | null; onJoin: () => void }) {
	if (!merchant) return null

	const distanceText = distance ? `${(distance * 1000).toFixed(0)}m` : 'Nearby'
	const waitTime = merchant.currentQueueDepth * 5

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-5"
		>
			<div className="flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Quick Pick</span>
						<span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
							{merchant.currentQueueDepth} spots open
						</span>
					</div>
					<h3 className="text-xl font-bold text-white mb-1">{merchant.name}</h3>
					<p className="text-sm text-gray-400 flex items-center gap-2">
						<Ic.MapPin className="w-4 h-4" />
						{distanceText} away · {merchant.category}
					</p>
				</div>
				<button
					onClick={onJoin}
					className="px-5 py-2.5 rounded-xl bg-gradient-brand text-black font-bold text-sm hover:scale-105 transition-transform"
				>
					Get token
				</button>
			</div>
			{waitTime > 0 && (
				<p className="mt-3 text-sm text-yellow-300/80">
					Estimated wait: ~{waitTime} min
				</p>
			)}
		</motion.div>
	)
}

// Live Badge Component
function LiveBadge({ count }: { count: number }) {
	return (
		<div className="flex items-center gap-1.5 text-xs font-semibold">
			<span className="relative flex h-2 w-2">
				<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
				<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
			</span>
			<span className={count > 10 ? 'text-yellow-400' : 'text-green-400'}>
				{count} waiting
			</span>
		</div>
	)
}

// Enhanced Merchant Card
function MerchantCard({ merchant, index, onClick }: { merchant: any; index: number; onClick: () => void }) {
	const waitTime = merchant.currentQueueDepth * 5
	const isQuick = merchant.currentQueueDepth < 5
	const distance = merchant.distance ? `${(merchant.distance).toFixed(1)}km` : null

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ delay: index * 0.05, duration: 0.3 }}
			whileHover={{ y: -4, transition: { duration: 0.2 } }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			className="cursor-pointer"
		>
			<div className={s.card + " flex items-center gap-4 p-4"}>
				{/* Icon */}
				<div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
					{merchant.category?.toLowerCase().includes('coffee') && '☕'}
					{merchant.category?.toLowerCase().includes('pharmacy') && '💊'}
					{merchant.category?.toLowerCase().includes('bakery') && '🥐'}
					{merchant.category?.toLowerCase().includes('grocery') && '🛒'}
					{merchant.category?.toLowerCase().includes('health') && '🏥'}
					{merchant.category?.toLowerCase().includes('salon') && '💈'}
					{merchant.category?.toLowerCase().includes('finance') && '🏦'}
					{merchant.category?.toLowerCase().includes('dining') && '🍽️'}
					{!['coffee', 'pharmacy', 'bakery', 'grocery', 'health', 'salon', 'finance', 'dining'].some(c =>
						merchant.category?.toLowerCase().includes(c)) && '🏪'}
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-bold text-white truncate">{merchant.name}</h3>
						{isQuick && (
							<span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
								Quick
							</span>
							)}
					</div>
					<div className="flex items-center gap-2 text-xs text-gray-400">
						<span>{merchant.category}</span>
						<span>·</span>
						<span className="flex items-center gap-1">
							<Ic.Star className="w-3 h-3 text-yellow-500" />
							4.8
						</span>
						{distance && (
							<>
								<span>·</span>
								<span>{distance}</span>
							</>
							)}
					</div>
				</div>

				{/* Queue Info */}
				<div className="text-right flex-shrink-0">
					<div className="text-sm font-bold text-yellow-400 mb-1">
						~{waitTime} min
					</div>
					<LiveBadge count={merchant.currentQueueDepth} />
				</div>
			</div>
		</motion.div>
	)
}

export default function ConsumerHome() {
	const { user, profile } = useAuthStore()
	const { coords, permissionGranted } = useLocationStore()
	const { add: addToast } = useToasts()
	const router = useRouter()

	const displayName = profile?.name || (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'Member'

	const [merchants, setMerchants] = useState<any[]>([])
	const [urgencyMerchant, setUrgencyMerchant] = useState<any>(null)
	const [urgencyDistance, setUrgencyDistance] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState("")
	const [activeCat, setActiveCat] = useState("all")
	const [activeFilters, setActiveFilters] = useState<string[]>([])
	const [searchFocus, setSearchFocus] = useState(false)
	const searchRef = useRef<HTMLInputElement>(null)

	// Fetch merchants with location and category
	const fetchMerchants = useCallback(async () => {
		setLoading(true)
		try {
			let url = `/merchant?category=${activeCat === 'all' ? '' : activeCat}`
			if (coords) {
				url += `&lat=${coords.lat}&lon=${coords.lon}`
			}
			if (search) {
				url += `&q=${encodeURIComponent(search)}`
			}

			const res = await api.get(url)
			setMerchants(res.data.data)
		} catch (err) {
			addToast('Failed to connect to Spotly network', 'error')
		} finally {
			setLoading(false)
		}
	}, [activeCat, coords, search, addToast])

	// Fetch urgency hero card data
	const fetchUrgencyMerchant = useCallback(async () => {
		if (!coords) return
		try {
			const url = `/merchant?sort=queue_asc&limit=1&lat=${coords.lat}&lon=${coords.lon}`
			const res = await api.get(url)
			if (res.data.data?.length > 0) {
				const merchant = res.data.data[0]
				setUrgencyMerchant(merchant)
				setUrgencyDistance(merchant.distance || null)
			}
		} catch {
			// Silently fail - urgency card is optional
		}
	}, [coords])

	// Initial fetch and when deps change
	useEffect(() => {
		fetchMerchants()
	}, [fetchMerchants])

	// Fetch urgency merchant when coords available
	useEffect(() => {
		if (coords && permissionGranted) {
			fetchUrgencyMerchant()
		}
	}, [coords, permissionGranted, fetchUrgencyMerchant])

	// Toggle filter
	const toggleFilter = (filterId: string) => {
		setActiveFilters(prev =>
			prev.includes(filterId)
				? prev.filter(id => id !== filterId)
				: [...prev, filterId]
		)
	}

	// Apply filters to merchants
	const filtered = merchants.filter(m => {
		// Search filter
		const matchSearch = !search ||
			m.name?.toLowerCase()?.includes(search.toLowerCase()) ||
			m.category?.toLowerCase()?.includes(search.toLowerCase())

		// Active filter pills
		const matchFilters = activeFilters.every(filterId => {
			const pill = FILTER_PILLS.find(p => p.id === filterId)
			return pill ? pill.filter(m) : true
		})

		return matchSearch && matchFilters
	})

	// Handle join from urgency card
	const handleUrgencyJoin = () => {
		if (urgencyMerchant?.outlets?.[0]?.id) {
			router.push(`/merchant/${urgencyMerchant.id}`)
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			style={{ padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto' }}
		>
			<GeolocationPrompt />

			{/* HEADER */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
				<div>
					<h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>
						Hey, {displayName.split(' ')[0]}
					</h1>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: 600 }}>
						<Ic.MapPin />
						<span>{coords ? 'Using your location' : (permissionGranted ? 'Locating...' : 'Bengaluru, India')}</span>
						<div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1fd97c' }} />
					</div>
				</div>
				<div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
					{displayName[0].toUpperCase()}
				</div>
			</div>

			{/* URGENCY HERO CARD */}
			{urgencyMerchant && !search && (
				<UrgencyHeroCard
					merchant={urgencyMerchant}
					distance={urgencyDistance}
					onJoin={handleUrgencyJoin}
				/>
			)}

			{/* SEARCH */}
			<div style={{ position: 'relative', marginBottom: 24 }}>
				<div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.2)', pointerEvents: 'none' }}>
					<Ic.Search />
				</div>
				<input
					ref={searchRef}
					style={{ ...s.input, paddingLeft: 48, paddingRight: 50, border: `1px solid ${searchFocus ? 'rgba(245,196,24,.3)' : 'rgba(255,255,255,.06)'}`, boxShadow: searchFocus ? '0 0 0 4px rgba(245,196,24,.05)' : 'none' }}
					placeholder="Search cafés, clinics, and more..."
					value={search}
					onChange={e => setSearch(e.target.value)}
					onFocus={() => setSearchFocus(true)}
					onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
				/>
				<AnimatePresence>
					{search && (
						<motion.button
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 8, padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,.3)', display: 'flex' }}
							onClick={() => setSearch('')}
						>
							<Ic.X />
						</motion.button>
					)}
				</AnimatePresence>
			</div>

			{/* CATEGORIES */}
			<div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 16 }} className="no-scrollbar">
				{CATEGORIES.map(c => (
					<button
						key={c.id}
						onClick={() => setActiveCat(c.id)}
						style={{
							...s.categoryBtn,
							background: activeCat === c.id ? THEME.gradients.consumer : 'rgba(255,255,255,.03)',
							color: activeCat === c.id ? '#000' : 'rgba(255,255,255,.5)',
							border: `1px solid ${activeCat === c.id ? 'transparent' : 'rgba(255,255,255,.06)'}`,
							boxShadow: activeCat === c.id ? '0 8px 24px rgba(245,196,24,.25)' : 'none'
						}}
					>
						<span style={{ marginRight: 6 }}>{c.emoji}</span>{c.label}
					</button>
				))}
			</div>

			{/* FILTER PILLS */}
			<div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
				{FILTER_PILLS.map(pill => (
					<button
						key={pill.id}
						onClick={() => toggleFilter(pill.id)}
						className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
							activeFilters.includes(pill.id)
								? 'bg-white/10 text-white border border-white/20'
								: 'bg-transparent text-gray-400 border border-white/10 hover:bg-white/5'
						}`}
					>
						{pill.label}
					</button>
				))}
			</div>

			{/* MERCHANT GRID */}
			<div>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
					<h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 19 }}>Nearby Partners</h2>
					<span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', fontWeight: 700 }}>{filtered.length} AVAILABLE</span>
				</div>

				{loading ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						{[1, 2, 3].map(i => (
							<div key={i} style={{ ...s.card, height: 110, opacity: 0.5, background: 'rgba(255,255,255,.02)', animation: 'pulse 2s infinite' }} />
						))}
					</div>
				) : filtered.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						style={{ ...s.card, padding: '60px 20px', textAlign: 'center' }}
					>
						<div style={{ color: 'rgba(255,255,255,.15)', marginBottom: 16 }}><Ic.Search /></div>
						<div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>No matches found</div>
						<div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Try a different category or filter</div>
					</motion.div>
				) : (
					<AnimatePresence mode="wait">
						<motion.div
							key={activeCat + activeFilters.join(',') + search}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
						>
							{filtered.map((m, i) => (
								<MerchantCard
									key={m.id}
									merchant={m}
									index={i}
									onClick={() => router.push(`/merchant/${m.id}`)}
								/>
							))}
						</motion.div>
					</AnimatePresence>
				)}
			</div>
		</motion.div>
	)
}

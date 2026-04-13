"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { Merchant } from "@spotly/types"
import { motion, AnimatePresence } from "framer-motion"
import {
	Search as SearchIcon,
	MapPin,
	ShoppingBag,
	Star,
	Clock,
	Filter,
	Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OnboardingModal } from "@/components/OnboardingModal"

export default function HomeDashboardPage() {
	const { user, profile, loading, signOut } = useAuthStore()
	const [merchants, setMerchants] = useState<Merchant[]>([])
	const [meta, setMeta] = useState<{ location?: string } | null>(null)
	const [merchantsLoading, setMerchantsLoading] = useState(false)
	const [areaSearch, setAreaSearch] = useState("")
	const [activeCategory, setActiveCategory] = useState("All")
	const router = useRouter()

	const categories = [
		"All",
		"Groceries",
		"Bakery",
		"Pharmacy",
		"Restaurant",
		"Retail",
	]

	useEffect(() => {
		if (!loading && !user) {
			router.push("/")
		}
	}, [loading, user, router])

	useEffect(() => {
		if (!loading && user) {
			setMerchantsLoading(true)
			const locationQuery = areaSearch.trim() || profile?.location || ""
			api.get("/merchant", {
				params: {
					location: locationQuery,
					category: activeCategory,
				},
			})
				.then((res) => {
					setMerchants(res.data.data ?? [])
					setMeta(res.data.meta ?? null)
					setMerchantsLoading(false)
				})
				.catch(() => setMerchantsLoading(false))
		}
	}, [loading, user, profile?.location, areaSearch, activeCategory])

	const filtered = merchants.filter(
		(m) =>
			activeCategory === "All" ||
			m.category.toLowerCase().includes(activeCategory.toLowerCase()),
	)

	if (loading || !user) return null

	return (
		<div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30">
			<OnboardingModal />

			{/* Animated Background Orbs */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
				<div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
			</div>

			{/* Navigation Bar */}
			<nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6">
				<div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
					<div className="flex items-center gap-10">
						<Link href="/home" className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
								<Clock className="w-6 h-6 text-black" />
							</div>
							<span className="text-2xl font-black tracking-tighter text-white">
								spotly
							</span>
						</Link>

						{(meta?.location || profile?.location) && (
							<div className="hidden lg:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
								<MapPin className="w-4 h-4 text-yellow-500" />
								<span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors max-w-[200px] truncate">
									{meta?.location || profile?.location}
								</span>
							</div>
						)}
					</div>

					<div className="flex items-center gap-5">
						<div className="hidden sm:flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
							<button className="px-5 py-2 bg-gradient-brand text-black font-black text-sm rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-transform active:scale-95">
								Join Nearby
							</button>
							<button className="p-2 text-neutral-400 hover:text-white transition-colors">
								<ShoppingBag className="w-5 h-5" />
							</button>
						</div>

						<div className="h-8 w-[1px] bg-white/10 mx-2"></div>

						<div className="flex items-center gap-3">
							<div className="text-right hidden sm:block">
								<p className="text-sm font-black text-white leading-none">
									{profile?.name || user.displayName || "User"}
								</p>
								<div className="flex gap-3 justify-end mt-1.5">
									<button
										onClick={() => useAuthStore.getState().clearProfile()}
										className="text-[10px] font-black text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-[0.2em]"
									>
										Reset Profile
									</button>
									<span className="text-white/20 text-[10px]">•</span>
									<button
										onClick={() => signOut()}
										className="text-[10px] font-black text-neutral-500 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
									>
										Sign Out
									</button>
								</div>
							</div>
							<div className="w-11 h-11 rounded-2xl bg-gradient-brand p-[2px]">
								<div className="w-full h-full rounded-[14px] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
									{user.photoURL ? (
										<img
											src={user.photoURL}
											alt="Avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-yellow-500 font-black text-lg">
											{user.email?.[0].toUpperCase()}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</nav>

			<main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
				{/* Hero Section */}
				<div className="flex flex-col items-center text-center mb-16">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 font-bold text-xs mb-8 backdrop-blur-md"
					>
						<Sparkles className="w-3.5 h-3.5 animate-pulse" />
						Real-Time Queue Management
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight leading-[0.9]"
					>
						Nearby for <span className="text-gradient">Pickup</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="text-lg md:text-xl text-neutral-400 font-medium max-w-2xl"
					>
						Discover local merchants, check live wait times, and join
						queues remotely. Reclaim your time.
					</motion.p>
				</div>

				{/* Search & Action Bar */}
				<div className="flex flex-col md:flex-row gap-5 mb-16">
					<div className="relative flex-1 group">
						<SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-600 group-focus-within:text-yellow-500 transition-colors" />
						<input
							type="text"
							placeholder="Search an area or city..."
							value={areaSearch}
							onChange={(e) => setAreaSearch(e.target.value)}
							className="w-full h-20 bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] pl-16 pr-8 text-xl font-bold placeholder:text-neutral-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/30 transition-all selection:bg-yellow-500/30"
						/>
					</div>
					<button className="h-20 px-10 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-white/10 transition-all group active:scale-95">
						<Filter className="w-6 h-6 text-neutral-400 group-hover:text-yellow-500 transition-colors" />
						<span className="font-black text-neutral-300">Filters</span>
					</button>
				</div>

				{/* Category Pill Sliders */}
				<div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar mb-12">
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setActiveCategory(cat)}
							className={`whitespace-nowrap px-8 py-4 rounded-2xl text-sm font-black transition-all border-2 ${
								activeCategory === cat
									? "bg-gradient-brand text-black border-transparent shadow-[0_0_30px_rgba(250,204,21,0.2)]"
									: "bg-white/5 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white"
							}`}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Store Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					<AnimatePresence mode="popLayout">
						{merchantsLoading ? (
							Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="bg-white/5 rounded-[3rem] p-5 border border-white/5 animate-shimmer h-[420px]"
								/>
							))
						) : filtered.length === 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="col-span-full py-32 text-center"
							>
								<div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 border-dashed">
									<MapPin className="w-10 h-10 text-neutral-700" />
								</div>
								<h3 className="text-3xl font-black text-white">
									No spots in {profile?.location || "this area"}
								</h3>
								<p className="text-neutral-500 mt-3 text-lg font-medium max-w-md mx-auto">
									We haven't launched in this location yet. Try
									searching for "San Francisco" or browse all
									merchants.
								</p>
							</motion.div>
						) : (
							filtered.map((merchant, index) => (
								<motion.div
									layout
									key={merchant.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<Link href={`/merchant/${merchant.id}`}>
										<div className="group bg-neutral-900/50 rounded-[3rem] p-5 border border-white/5 hover:border-yellow-500/30 hover:bg-neutral-900 transition-all duration-500 overflow-hidden cursor-pointer active:scale-[0.98]">
											{/* Modern Visual Container */}
											<div className="relative w-full h-[240px] bg-[#1a1a1a] rounded-[2.5rem] mb-6 overflow-hidden">
												{/* Status Pill */}
												<div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
													<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
													<span className="text-[10px] font-black text-white uppercase tracking-widest">
														Active
													</span>
												</div>

												{/* Time Badge */}
												<div className="absolute bottom-4 left-4 z-10 bg-yellow-500 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl shadow-yellow-500/20 group-hover:scale-105 transition-transform">
													<Clock className="w-3.5 h-3.5 text-black" />
													<span className="text-[11px] font-black text-black uppercase">
														{merchant.estimatedWaitTime ||
															"15-20 MIN"}
													</span>
												</div>

												{/* Card Preview Icon */}
												<div className="w-full h-full flex items-center justify-center text-7xl opacity-20 filter grayscale blur-[2px] group-hover:blur-0 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-700">
													{merchant.category
														.toLowerCase()
														.includes("food")
														? "🥡"
														: merchant.category
																.toLowerCase()
																.includes("pharmacy")
														? "💊"
														: "🏢"}
												</div>

												{/* Subtle Hover Gradient */}
												<div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											</div>

											<div className="flex justify-between items-start px-3 pb-2">
												<div>
													<h3 className="text-2xl font-black text-white group-hover:text-yellow-500 transition-colors tracking-tight">
														{merchant.name}
													</h3>
													<div className="flex items-center gap-2 mt-1.5">
														<span className="text-xs font-bold text-neutral-500 capitalize">
															{merchant.category}
														</span>
														<span className="w-1 h-1 rounded-full bg-neutral-700" />
														<span className="text-xs font-bold text-neutral-500">
															Nearby
														</span>
													</div>
												</div>
												<div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl group-hover:bg-yellow-500/10 group-hover:border-yellow-500/20 transition-all">
													<Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
													<span className="text-sm font-black text-white">
														{merchant.rating || "4.8"}
													</span>
												</div>
											</div>
										</div>
									</Link>
								</motion.div>
							))
						)}
					</AnimatePresence>
				</div>
			</main>

			{/* Footer */}
			<footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
				<div className="flex flex-col items-center md:items-start">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
							<Clock className="w-5 h-5 text-black" />
						</div>
						<span className="text-xl font-black tracking-tighter text-white">
							spotly
						</span>
					</div>
					<p className="text-sm text-neutral-500 font-bold mt-4">
						© 2024 Spotly Technologies Inc. All rights reserved.
					</p>
				</div>
				<div className="flex gap-10 text-sm font-black text-neutral-500">
					<a href="#" className="hover:text-yellow-500 transition-colors">
						Privacy
					</a>
					<a href="#" className="hover:text-yellow-500 transition-colors">
						Terms
					</a>
					<a href="#" className="hover:text-yellow-500 transition-colors">
						Help
					</a>
				</div>
			</footer>
		</div>
	)
}

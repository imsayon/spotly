"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { Merchant } from "@spotly/types"
import { motion } from "framer-motion"
import {
	Clock,
	Smartphone,
	Zap,
	ArrowRight,
	Search as SearchIcon,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
	const { user, signInWithGoogle, signOut, loading } = useAuthStore()
	const [merchants, setMerchants] = useState<Merchant[]>([])
	const [merchantsLoading, setMerchantsLoading] = useState(true)
	const [search, setSearch] = useState("")

	useEffect(() => {
		if (!loading) {
			api.get("/merchant").then((res) => {
				setMerchants(res.data.data ?? [])
				setMerchantsLoading(false)
			})
		}
	}, [loading])

	const filtered = merchants.filter(
		(m) =>
			m.name.toLowerCase().includes(search.toLowerCase()) ||
			m.category.toLowerCase().includes(search.toLowerCase()),
	)

	if (loading) return null

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						<div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
							<Clock className="w-6 h-6 text-black" />
						</div>
						<div>
							<h1 className="text-xl font-bold text-gradient">
								Spotly
							</h1>
							<p className="text-xs text-gray-500 font-medium">
								Skip the Wait
							</p>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						{user ? (
							<>
								<div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
									{user.photoURL ? (
										<img
											src={user.photoURL}
											alt="Avatar"
											className="w-6 h-6 rounded-full border border-brand-500/50"
										/>
									) : (
										<div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-black">
											{user.email?.[0].toUpperCase()}
										</div>
									)}
									<span className="text-sm text-gray-300 truncate max-w-[120px]">
										{user.displayName ||
											user.email?.split("@")[0]}
									</span>
								</div>
								<button
									onClick={signOut}
									className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300"
								>
									Sign out
								</button>
							</>
						) : (
							<button
								onClick={signInWithGoogle}
								className="btn-primary"
							>
								<span>Sign in</span>
								<ArrowRight className="w-4 h-4 ml-2" />
							</button>
						)}
					</motion.div>
				</div>
			</nav>

			{/* Hero Section */}
			<motion.section
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.8 }}
				className="relative py-20 overflow-hidden"
			>
				{/* Glowing orbs background */}
				<div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-yellow-500/15 rounded-full blur-[150px] opacity-60 pointer-events-none" />
				<div className="absolute bottom-0 -right-1/4 w-[900px] h-[900px] bg-orange-500/10 rounded-full blur-[150px] opacity-50 pointer-events-none" />

				<div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: "easeOut" }}
						className="flex flex-col items-center"
					>
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-semibold text-sm mb-8 backdrop-blur-md mb-6">
							<div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
							Queue Management Reimagined
						</div>

						<h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
							Skip the line,{" "}
							<span className="text-gradient">join remotely</span>
						</h1>

						<p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
							Browse local restaurants, clinics, and stores. Join
							queues from anywhere and get real-time token
							updates. No more waiting around.
						</p>

						{!user && (
							<button
								onClick={signInWithGoogle}
								className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-black transition-all duration-200 bg-gradient-brand rounded-2xl hover:shadow-[0_0_60px_rgba(250,204,21,0.6)] active:scale-95"
							>
								<span>Get Started with Google</span>
								<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</button>
						)}
					</motion.div>

					{/* Feature Cards */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							ease: "easeOut",
						}}
						className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left"
					>
						<div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
							<div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20" />
							<div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mb-6">
								<Clock className="w-6 h-6 text-black" />
							</div>
							<h3 className="text-xl font-bold text-white mb-3">
								Real-time Updates
							</h3>
							<p className="text-sm text-gray-400">
								Get instant notifications when your token is
								called. Never miss your turn, even from miles
								away.
							</p>
						</div>

						<div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
							<div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-orange-500/20" />
							<div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mb-6">
								<Smartphone className="w-6 h-6 text-black" />
							</div>
							<h3 className="text-xl font-bold text-white mb-3">
								Browse & Join
							</h3>
							<p className="text-sm text-gray-400">
								Discover merchants near you, check queue
								lengths, and join with a single tap. That
								simple.
							</p>
						</div>

						<div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
							<div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20" />
							<div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mb-6">
								<Zap className="w-6 h-6 text-black" />
							</div>
							<h3 className="text-xl font-bold text-white mb-3">
								Save Time Daily
							</h3>
							<p className="text-sm text-gray-400">
								Spend less time waiting and more time enjoying.
								Reclaim your time with smart queue management.
							</p>
						</div>
					</motion.div>
				</div>
			</motion.section>

			{/* Merchants Section */}
			<section className="relative py-20">
				<div className="max-w-6xl mx-auto px-6">
					{/* Search Bar */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="mb-16 text-center"
					>
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
							Browse Merchants
						</h2>
						<p className="text-gray-400 mb-8 max-w-xl mx-auto">
							Search for your favorite places and join their
							queues
						</p>

						<div className="relative max-w-2xl mx-auto">
							<SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								type="text"
								placeholder="Search merchants or categories..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-surface border border-border rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all duration-300"
							/>
						</div>
					</motion.div>

					{/* Merchants Grid */}
					{merchantsLoading ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="card h-56 animate-shimmer"
								/>
							))}
						</div>
					) : filtered.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center py-24 text-gray-500"
						>
							<div className="text-6xl mb-4 opacity-50">🏪</div>
							<p className="text-xl font-medium">
								No merchants found yet
							</p>
							<p className="text-sm mt-2">
								Try a different search or check back later
							</p>
						</motion.div>
					) : (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
						>
							{filtered.map((merchant, index) => (
								<motion.div
									key={merchant.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									whileHover={{ y: -5 }}
								>
									<Link href={`/merchant/${merchant.id}`}>
										<div className="card cursor-pointer overflow-hidden group h-full flex flex-col">
											{/* Image Placeholder */}
											<div className="w-full h-32 bg-gradient-brand group-hover:scale-105 transition-transform duration-300 rounded-xl mb-4 flex items-center justify-center">
												<div className="text-4xl">
													🏪
												</div>
											</div>

											<h3 className="text-lg font-bold text-white mb-1 group-hover:text-gradient transition-all">
												{merchant.name}
											</h3>
											<p className="text-sm text-gray-400 mb-4 flex-1">
												{merchant.category}
											</p>

											<div className="flex items-center justify-between pt-4 border-t border-border">
												<span className="badge text-xs">
													Join Queue
												</span>
												<span className="text-xs text-gray-500 font-medium">
													→
												</span>
											</div>
										</div>
									</Link>
								</motion.div>
							))}
						</motion.div>
					)}
				</div>
			</section>

			{/* CTA Section */}
			{!user && (
				<section className="relative py-20 overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-orange-500/10" />
					<div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
								Ready to skip the wait?
							</h2>
							<p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
								Join thousands of users who are already saving
								time with Spotly. Sign in with Google to get
								started.
							</p>
							<button
								onClick={signInWithGoogle}
								className="btn-primary inline-flex items-center gap-2"
							>
								<span>Sign in with Google</span>
								<ArrowRight className="w-5 h-5" />
							</button>
						</motion.div>
					</div>
				</section>
			)}
		</div>
	)
}

"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { motion } from "framer-motion"
import {
	Clock,
	Smartphone,
	Zap,
	ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
	const { user, signInWithGoogle, loading } = useAuthStore()
	const router = useRouter()

	useEffect(() => {
		if (!loading && user) {
			router.push("/home")
		}
	}, [loading, user, router])

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
						{!user && (
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
				className="relative py-20 overflow-hidden min-h-[90vh] flex flex-col justify-center"
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
		</div>
	)
}

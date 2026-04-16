'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Navigation } from 'lucide-react'
import { useLocationStore } from '@/store/location.store'

export function GeolocationPrompt() {
	const { permissionGranted, isLoading, error, requestLocation } = useLocationStore()
	const [isOpen, setIsOpen] = useState(false)

	useEffect(() => {
		// Show prompt if permission not granted (and not already loading)
		if (!permissionGranted && !isLoading) {
			const timer = setTimeout(() => setIsOpen(true), 1000)
			return () => clearTimeout(timer)
		}
	}, [permissionGranted, isLoading])

	const handleEnable = async () => {
		await requestLocation()
		setIsOpen(false)
	}

	const handleDismiss = () => {
		setIsOpen(false)
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					className="fixed bottom-6 left-4 right-4 z-50"
				>
					<div className="bg-surface border border-border rounded-2xl p-4 shadow-xl max-w-md mx-auto">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
								<MapPin className="w-6 h-6 text-black" />
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-bold text-white text-base mb-1">
									Enable location
								</h3>
								<p className="text-sm text-gray-400 leading-relaxed">
									Allow access to find queues near you and get accurate wait times
								</p>
								{error && (
									<p className="text-xs text-red-400 mt-2">{error}</p>
								)}
							</div>
							<button
								onClick={handleDismiss}
								className="p-2 rounded-lg hover:bg-white/5 transition-colors"
							>
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>
						<div className="flex gap-3 mt-4">
							<button
								onClick={handleDismiss}
								className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold text-gray-400 hover:bg-white/5 transition-colors"
							>
								Not now
							</button>
							<button
								onClick={handleEnable}
								disabled={isLoading}
								className="flex-1 py-3 px-4 rounded-xl bg-gradient-brand text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
								) : (
									<>
										<Navigation className="w-4 h-4" />
										Enable
									</>
								)}
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

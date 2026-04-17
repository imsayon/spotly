"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, THEME } from "@spotly/ui"
import api from "@/lib/api"

interface ReviewDrawerProps {
	isOpen: boolean
	onClose: () => void
	outletId: string
	outletName: string
	onSubmitSuccess?: () => void
}

export function ReviewDrawer({ isOpen, onClose, outletId, outletName, onSubmitSuccess }: ReviewDrawerProps) {
	const [rating, setRating] = useState(0)
	const [comment, setComment] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	const handleSubmit = async () => {
		if (rating === 0) return
		setSubmitting(true)
		try {
			await api.post("/review", {
				outletId,
				rating,
				comment: comment.trim() || undefined
			})
			setSubmitted(true)
			setTimeout(() => {
				onSubmitSuccess?.()
				onClose()
			}, 1500)
		} catch (err) {
			console.error("Review submit failed:", err)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
					/>
					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="fixed bottom-0 left-0 right-0 bg-[#0c0c12] border-t border-white/10 rounded-t-[32px] p-8 z-[101] max-w-md mx-auto"
					>
						<div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
						
						{submitted ? (
							<div className="text-center py-12">
								<div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
									<Ic.Check className="w-10 h-10 text-green-500" />
								</div>
								<h2 className="text-2xl font-black mb-2">Thank You!</h2>
								<p className="text-gray-400">Your feedback helps {outletName} improve.</p>
							</div>
						) : (
							<>
								<h2 className="text-2xl font-black mb-2">How was your visit?</h2>
								<p className="text-gray-400 mb-8">Rate your experience at {outletName}</p>

								<div className="flex justify-center gap-4 mb-10">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											onClick={() => setRating(star)}
											className="transition-transform active:scale-90"
										>
											<Ic.Star
												className={`w-10 h-10 ${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-white/10"}`}
											/>
										</button>
									))}
								</div>

								<textarea
									placeholder="Any additional feedback? (Optional)"
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 mb-8 resize-none h-32 focus:border-yellow-500/50 transition-colors outline-none"
								/>

								<button
									disabled={rating === 0 || submitting}
									onClick={handleSubmit}
									className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
										rating > 0 
											? "bg-gradient-brand text-black shadow-lg shadow-yellow-500/20" 
											: "bg-white/5 text-white/20 cursor-not-allowed"
									}`}
								>
									{submitting ? "Submitting..." : "Post Review"}
								</button>
							</>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

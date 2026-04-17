"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
	motion,
	AnimatePresence,
	useSpring,
	useMotionValue,
	useTransform,
} from "framer-motion"
import { Ic, useToasts, THEME, Orb } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore } from "@/store/queue.store"
import { io, Socket } from "socket.io-client"
import api from "@/lib/api"
import { QueueEntry } from "@spotly/types"
import { ReviewDrawer } from "@/components/ReviewDrawer"

const s = {
	...THEME.styles,
	tokenCircle: {
		width: 240,
		height: 240,
		borderRadius: "50%",
		background: "rgba(255,255,255,.01)",
		border: "1px solid rgba(255,255,255,.08)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		margin: "0 auto 40px",
		position: "relative",
	} as React.CSSProperties,
	statusBadge: {
		padding: "8px 20px",
		borderRadius: 99,
		fontSize: 12,
		fontWeight: 900,
		textTransform: "uppercase",
		letterSpacing: 1.5,
		marginBottom: 32,
		display: "inline-flex",
		alignItems: "center",
		gap: 8,
		border: "1px solid currentColor",
		background: "rgba(255,255,255,.05)",
	} as React.CSSProperties,
}

export default function ConsumerQueuePage() {
	const { entryId } = useParams()
	const router = useRouter()
	const { user } = useAuthStore()
	const { add: addToast } = useToasts()
	const { entries, handleQueueUpdate, handleTokenCalled, avgWaitPerPerson } =
		useQueueStore()

	const [entry, setEntry] = useState<QueueEntry | null>(null)
	const [loading, setLoading] = useState(true)
	const [ahead, setAhead] = useState(0)
	const [totalWaiting, setTotalWaiting] = useState(0)
	const [calledAt, setCalledAt] = useState<Date | null>(null)
	const [countdown, setCountdown] = useState(120) // 2 minutes in seconds
	const [showReview, setShowReview] = useState(false)
	const [localOutletName, setLocalOutletName] = useState("")

	// Animated spring value for smooth ahead count transitions
	const [animatedAheadValue, setAnimatedAheadValue] = useState(ahead)
	const springAhead = useSpring(ahead, { stiffness: 100, damping: 20 })

	// Animated token number for initial count-up effect
	const [displayToken, setDisplayToken] = useState(0)
	const tokenSpring = useSpring(0, { stiffness: 50, damping: 15 })
	const animatedToken = useTransform(tokenSpring, (v) => Math.round(v))

	// 1. Initial Data Fetch
	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await api.get(`/queue/entry/${entryId}`)
				const data = res.data.data
				setEntry(data)
				if (data.outletName) setLocalOutletName(data.outletName)
				
				// Get current queue state for this outlet to compute ahead/total
				const qRes = await api.get(`/queue/${data.outletId}`)
				const { entries: qEntries } = qRes.data.data
				
				const waitingAhead = qEntries.filter(
					(e: any) => e.status === "WAITING" && e.tokenNumber < data.tokenNumber
				).length
				const waitingTotal = qEntries.filter((e: any) => e.status === "WAITING").length
				
				setAhead(waitingAhead)
				setTotalWaiting(waitingTotal)
			} catch (err) {
				addToast("Failed to load reservation", "error")
			} finally {
				setLoading(false)
			}
		}
		if (entryId) fetchData()
	}, [entryId, addToast])

	// Countdown timer logic when CALLED
	useEffect(() => {
		if (entry?.status === "SERVED" && !showReview) {
			const timer = setTimeout(() => setShowReview(true), 1000)
			return () => clearTimeout(timer)
		}

		if (entry?.status !== "CALLED" || !entry.calledAt) return

		const interval = setInterval(() => {
			const calledTime = new Date(entry.calledAt!).getTime()
			const now = Date.now()
			const elapsed = Math.floor((now - calledTime) / 1000)
			const remaining = Math.max(0, 300 - elapsed)
			setCountdown(remaining)
		}, 1000)

		return () => clearInterval(interval)
	}, [entry?.status, entry?.calledAt])

	// Initial token count-up animation
	useEffect(() => {
		if (entry && !loading) {
			tokenSpring.set(entry.tokenNumber)
		}
	}, [entry, loading, tokenSpring])

	// Update spring when ahead changes
	useEffect(() => {
		springAhead.set(ahead)
	}, [ahead, springAhead])

	// Subscribe to animated values
	useEffect(() => {
		const unsubscribeToken = animatedToken.on("change", (v) =>
			setDisplayToken(v),
		)
		return unsubscribeToken
	}, [animatedToken])

	useEffect(() => {
		const unsubscribeAhead = springAhead.on("change", (v) =>
			setAnimatedAheadValue(Math.round(v)),
		)
		return unsubscribeAhead
	}, [springAhead])

	// Countdown timer for CALLED state
	useEffect(() => {
		if (!calledAt) return

		const interval = setInterval(() => {
			const elapsed = Math.floor((Date.now() - calledAt.getTime()) / 1000)
			const remaining = Math.max(0, 120 - elapsed)
			setCountdown(remaining)

			if (remaining === 0) {
				clearInterval(interval)
			}
		}, 1000)

		return () => clearInterval(interval)
	}, [calledAt])

	// Enhanced notification for CALLED state
	const triggerCalledEffects = () => {
		// Vibration pattern
		if ("vibrate" in navigator) {
			navigator.vibrate([200, 100, 200, 100, 200])
		}

		// Play enhanced notification sound
		try {
			const audioContext = new (
				window.AudioContext || (window as any).webkitAudioContext
			)()
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)

			// Triumphant three-tone chime
			oscillator.frequency.setValueAtTime(
				523.25,
				audioContext.currentTime,
			) // C5
			oscillator.frequency.setValueAtTime(
				659.25,
				audioContext.currentTime + 0.1,
			) // E5
			oscillator.frequency.setValueAtTime(
				783.99,
				audioContext.currentTime + 0.2,
			) // G5

			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + 0.5,
			)

			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + 0.5)
		} catch {
			// Silently fail if Web Audio API not available
		}
	}

	// 2. WebSocket Sync
	useEffect(() => {
		if (!entry?.outletId) return

		const socket: Socket = io(
			process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001",
			{ transports: ["websocket"] },
		)

		socket.on("connect", () => {
			socket.emit("join_outlet", { outletId: entry.outletId })
		})

		socket.on("queue_update", (payload: any) => {
			handleQueueUpdate(payload)
			// Update local state if this entry is in the update
			const updated = payload.entries.find((e: any) => e.id === entryId)
			if (updated) setEntry(updated)

			// Calculate ahead
			const waitingAhead = payload.entries.filter(
				(e: any) =>
					e.status === "WAITING" &&
					e.tokenNumber < (updated?.tokenNumber ?? entry.tokenNumber),
			).length
			const waitingTotal = payload.entries.filter(
				(e: any) => e.status === "WAITING",
			).length
			setAhead(waitingAhead)
			setTotalWaiting(waitingTotal)
		})

		socket.on("token_called", (payload: any) => {
			if (payload.tokenNumber === entry.tokenNumber) {
				handleTokenCalled(payload.tokenNumber)
				setEntry((prev: QueueEntry | null) =>
					prev ? { ...prev, status: "CALLED" } : null,
				)
				setCalledAt(new Date())
				triggerCalledEffects()
			}
		})

		return () => {
			socket.emit("leave_outlet", { outletId: entry.outletId })
			socket.disconnect()
		}
	}, [entry?.outletId, entryId, handleQueueUpdate, handleTokenCalled])

	const handleLeave = async () => {
		if (!confirm("Abandon your spot in the queue? This cannot be undone."))
			return
		try {
			await api.delete(`/queue/leave/${entryId}`)
			addToast("Reservation cancelled", "info")
			router.push("/home")
		} catch (err) {
			addToast("Failed to cancel reservation", "error")
		}
	}

	if (loading) {
		return (
			<div
				style={{
					minHeight: "90vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<motion.div
					animate={{ rotate: 360 }}
					transition={{
						duration: 1,
						repeat: Infinity,
						ease: "linear",
					}}
					style={{
						width: 48,
						height: 48,
						border: "3px solid rgba(255,255,255,.03)",
						borderTopColor: "#f5c418",
						borderRadius: "50%",
					}}
				/>
			</div>
		)
	}

	if (!entry) return null

	const isCalled = entry.status === "CALLED"
	const isServed = entry.status === "SERVED"
	const isMissed = entry.status === "MISSED"
	const isWaiting = entry.status === "WAITING"

	const statusColor = isCalled
		? "#1fd97c"
		: isMissed
			? "#ff4d6d"
			: isServed
				? "#00cfff"
				: "#f5c418"

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	return (
		<>
			<AnimatePresence>
				{isCalled && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[200] bg-[#1fd97c] text-black p-8 flex flex-col items-center justify-center text-center"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className="mb-12"
						>
							<div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
								<Ic.Bell className="w-16 h-16" />
							</div>
							<h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">
								IT'S YOUR
								<br />
								TURN NOW!
							</h1>
							<p className="text-xl font-bold opacity-70">
								Token #{entry.tokenNumber} is ready at Head to
								the counter now!
							</p>
						</motion.div>

						<div className="bg-black/5 rounded-[40px] p-10 w-full mb-12">
							<div className="text-sm font-black uppercase tracking-widest opacity-50 mb-2">
								TIME TO REACH
							</div>
							<div className="text-7xl font-black font-mono">
								{formatTime(countdown)}
							</div>
						</div>

						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={() => router.push("/home")}
							className="w-full py-6 rounded-3xl bg-black text-white font-black text-xl shadow-2xl"
						>
							ALMOST THERE
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				style={{
					padding: "24px 20px 100px",
					maxWidth: 480,
					margin: "0 auto",
					textAlign: "center",
				}}
			>
				{/* HEADER */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						marginBottom: 48,
						textAlign: "left",
					}}
				>
					<motion.button
						whileHover={{
							scale: 1.05,
							background: "rgba(255,255,255,.08)",
						}}
						whileTap={{ scale: 0.95 }}
						onClick={() => router.push("/home")}
						style={{
							width: 44,
							height: 44,
							borderRadius: 14,
							background: "rgba(255,255,255,.04)",
							border: "1px solid rgba(255,255,255,.1)",
							color: "rgba(255,255,255,.6)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ic.ChevronLeft />
					</motion.button>
					<div>
						<h1
							style={{
								fontFamily: "var(--font-sans)",
								fontSize: 18,
								fontWeight: 900,
								letterSpacing: -0.5,
							}}
						>
							Live Status
						</h1>
						<p
							style={{
								color: "rgba(255,255,255,.3)",
								fontSize: 13,
								fontWeight: 600,
							}}
						>
							Spotly Token Reservation
						</p>
					</div>
				</div>

				{/* TOKEN CIRCLE */}
				<div style={{ ...s.tokenCircle }}>
					<Orb
						x="-10%"
						y="-10%"
						size="120%"
						color={`${statusColor}08`}
						anim="orb1 10s infinite"
					/>
					<motion.div
						layoutId="token-circle"
						animate={{ scale: isCalled ? [1, 1.05, 1] : 1 }}
						transition={{ duration: 2, repeat: Infinity }}
						style={{
							width: 200,
							height: 200,
							borderRadius: "50%",
							background: "rgba(255,255,255,.01)",
							border: `2px solid ${statusColor}40`,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: `0 0 60px ${statusColor}10`,
						}}
					>
						<div
							style={{
								fontSize: 11,
								fontWeight: 800,
								color: "rgba(255,255,255,.3)",
								textTransform: "uppercase",
								letterSpacing: 3,
								marginBottom: 8,
							}}
						>
							TOKEN
						</div>
						<div
							style={{
								fontSize: 84,
								fontWeight: 900,
								color: "#fff",
								fontFamily: "var(--font-sans)",
								lineHeight: 1,
								letterSpacing: -2,
							}}
						>
							{displayToken || entry.tokenNumber}
						</div>
					</motion.div>
				</div>

				{/* STATUS BADGE */}
				<div
					style={{
						...s.statusBadge,
						color: statusColor,
						borderColor: `${statusColor}30`,
					}}
				>
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: statusColor,
							boxShadow: `0 0 10px ${statusColor}`,
						}}
					/>
					{entry.status}
				</div>

				{/* MESSAGE */}
				<div style={{ marginBottom: 56 }}>
					<AnimatePresence mode="wait">
						{isCalled ? (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								key="called"
							>
								<h2
									style={{
										fontSize: 32,
										fontWeight: 900,
										marginBottom: 12,
										color: "#fff",
										letterSpacing: -1,
									}}
								>
									It's your turn!
								</h2>
								<p
									style={{
										color: "rgba(255,255,255,0.4)",
										fontSize: 16,
										lineHeight: 1.6,
									}}
								>
									Your spot is ready. Please present this
									token at the counter immediately.
								</p>
							</motion.div>
						) : isWaiting ? (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								key="waiting"
							>
								<h2
									style={{
										fontSize: 28,
										fontWeight: 900,
										marginBottom: 12,
										letterSpacing: -1,
									}}
								>
									Almost there!
								</h2>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: 14,
										marginTop: 32,
									}}
								>
									<div
										style={{
											...s.card,
											padding: "24px 16px",
											borderRadius: 24,
											textAlign: "center",
										}}
									>
										<motion.div
											style={{
												fontSize: 32,
												fontWeight: 900,
												color: "#f5c418",
												marginBottom: 4,
											}}
										>
											{animatedAheadValue}
										</motion.div>
										<div
											style={{
												fontSize: 11,
												color: "rgba(255,255,255,.2)",
												fontWeight: 800,
												textTransform: "uppercase",
												letterSpacing: 1,
											}}
										>
											Ahead Of You
										</div>
									</div>
									<div
										style={{
											...s.card,
											padding: "24px 16px",
											borderRadius: 24,
											textAlign: "center",
										}}
									>
										<div
											style={{
												fontSize: 32,
												fontWeight: 900,
												color: "#00cfff",
												marginBottom: 4,
											}}
										>
											~
											{Math.ceil(
												(ahead * avgWaitPerPerson) / 60,
											)}
											m
										</div>
										<div
											style={{
												fontSize: 11,
												color: "rgba(255,255,255,.2)",
												fontWeight: 800,
												textTransform: "uppercase",
												letterSpacing: 1,
											}}
										>
											Est. Wait
										</div>
									</div>
								</div>

								{/* Progress Bar */}
								<div
									style={{ marginTop: 28, padding: "0 4px" }}
								>
									<div
										style={{
											height: 6,
											borderRadius: 3,
											background: "rgba(255,255,255,.08)",
											overflow: "hidden",
										}}
									>
										<motion.div
											initial={{ width: 0 }}
											animate={{
												width: `${totalWaiting > 0 ? ((totalWaiting - ahead) / totalWaiting) * 100 : 0}%`,
											}}
											transition={{
												type: "spring",
												stiffness: 100,
												damping: 20,
											}}
											style={{
												height: "100%",
												borderRadius: 3,
												background:
													"linear-gradient(90deg, #f5c418, #ff9f43)",
											}}
										/>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											marginTop: 8,
										}}
									>
										<span
											style={{
												fontSize: 11,
												color: "rgba(255,255,255,.3)",
												fontWeight: 600,
											}}
										>
											Your position
										</span>
										<span
											style={{
												fontSize: 11,
												color: "#f5c418",
												fontWeight: 700,
											}}
										>
											{totalWaiting > 0
												? Math.round(
														((totalWaiting -
															ahead) /
															totalWaiting) *
															100,
													)
												: 0}
											% through
										</span>
									</div>
								</div>
							</motion.div>
						) : isServed ? (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								key="served"
							>
								<h2
									style={{
										fontSize: 28,
										fontWeight: 900,
										marginBottom: 8,
										letterSpacing: -1,
									}}
								>
									Served!
								</h2>
								<p
									style={{
										color: "rgba(255,255,255,0.4)",
										fontSize: 16,
									}}
								>
									Your request was processed successfully.
									Thank you for choosing us!
								</p>
							</motion.div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								key="missed"
							>
								<h2
									style={{
										fontSize: 28,
										fontWeight: 900,
										marginBottom: 8,
										color: "#ff4d6d",
										letterSpacing: -1,
									}}
								>
									Turn Missed
								</h2>
								<p
									style={{
										color: "rgba(255,255,255,0.4)",
										fontSize: 16,
									}}
								>
									You weren't available when called. Please
									rejoin the queue if needed.
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* ACTIONS */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					{isWaiting && (
						<motion.button
							whileHover={{
								y: -2,
								background: "rgba(255,77,109,.15)",
							}}
							whileTap={{ scale: 0.98 }}
							onClick={handleLeave}
							style={{
								width: "100%",
								padding: "18px",
								borderRadius: 20,
								background: "rgba(255,77,109,.08)",
								border: "1px solid rgba(255,77,109,.2)",
								color: "#ff4d6d",
								fontWeight: 800,
								fontSize: 15,
								cursor: "pointer",
								transition: "all .25s",
							}}
						>
							Cancel Token
						</motion.button>
					)}

					{(isServed || isMissed || isCalled) && (
						<motion.button
							whileHover={{
								y: -2,
								boxShadow: "0 12px 30px rgba(245,196,24,.3)",
							}}
							whileTap={{ scale: 0.98 }}
							onClick={() => router.push("/home")}
							style={{
								width: "100%",
								padding: "18px",
								borderRadius: 20,
								background: THEME.gradients.consumer,
								color: "#000",
								fontWeight: 900,
								fontSize: 15,
								cursor: "pointer",
								border: "none",
								boxShadow: "0 8px 24px rgba(245,196,24,.2)",
							}}
						>
							Return Home
						</motion.button>
					)}
				</div>

				{/* FULL-SCREEN CALLED TAKEOVER */}
				<AnimatePresence>
					{isCalled && (
						<motion.div
							layoutId="token-circle"
							initial={{ borderRadius: "50%" }}
							animate={{
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								borderRadius: 0,
								background:
									"linear-gradient(135deg, #1fd97c 0%, #00d084 100%)",
								zIndex: 9999,
							}}
							exit={{
								scale: 0.8,
								opacity: 0,
								transition: { duration: 0.3 },
							}}
							transition={{
								type: "spring",
								stiffness: 100,
								damping: 20,
								duration: 0.6,
							}}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								padding: "20px",
							}}
						>
							{/* Animated background orbs */}
							<div
								style={{
									position: "absolute",
									width: "200%",
									height: "200%",
									top: "-50%",
									left: "-50%",
									background:
										"radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
									animation: "pulse 2s infinite",
								}}
							/>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								style={{
									textAlign: "center",
									color: "#fff",
									zIndex: 1,
								}}
							>
								<div
									style={{
										fontSize: 18,
										fontWeight: 800,
										textTransform: "uppercase",
										letterSpacing: 3,
										marginBottom: 16,
										opacity: 0.9,
									}}
								>
									Your Token
								</div>

								<div
									style={{
										fontSize: 120,
										fontWeight: 900,
										fontFamily: "var(--font-sans)",
										lineHeight: 1,
										letterSpacing: -4,
										marginBottom: 24,
										textShadow:
											"0 4px 20px rgba(0,0,0,0.2)",
									}}
								>
									{entry.tokenNumber}
								</div>

								<motion.div
									initial={{ scale: 0.8 }}
									animate={{ scale: 1 }}
									transition={{
										type: "spring",
										stiffness: 200,
										damping: 10,
										repeat: Infinity,
										repeatType: "reverse",
									}}
									style={{
										fontSize: 32,
										fontWeight: 900,
										marginBottom: 16,
										textShadow:
											"0 2px 10px rgba(0,0,0,0.2)",
									}}
								>
									🎉 IT'S YOUR TURN! 🎉
								</motion.div>

								<div
									style={{
										fontSize: 18,
										opacity: 0.9,
										marginBottom: 32,
										lineHeight: 1.4,
									}}
								>
									Please proceed to the counter immediately
								</div>

								{/* Countdown Timer */}
								<motion.div
									animate={{
										scale:
											countdown < 30 ? [1, 1.05, 1] : 1,
									}}
									transition={{
										duration: 1,
										repeat: countdown < 30 ? Infinity : 0,
									}}
									style={{
										display: "inline-block",
										padding: "16px 32px",
										borderRadius: 16,
										background: "rgba(255,255,255,0.2)",
										backdropFilter: "blur(10px)",
										border: "2px solid rgba(255,255,255,0.3)",
									}}
								>
									<div
										style={{
											fontSize: 14,
											fontWeight: 600,
											opacity: 0.8,
											marginBottom: 4,
										}}
									>
										Time Remaining
									</div>
									<div
										style={{
											fontSize: 24,
											fontWeight: 900,
											fontFamily: "monospace",
										}}
									>
										{Math.floor(countdown / 60)}:
										{(countdown % 60)
											.toString()
											.padStart(2, "0")}
									</div>
								</motion.div>

								<motion.button
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.5 }}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => router.push("/home")}
									style={{
										marginTop: 32,
										padding: "16px 32px",
										borderRadius: 12,
										background: "rgba(255,255,255,0.9)",
										color: "#1fd97c",
										border: "none",
										fontSize: 16,
										fontWeight: 800,
										cursor: "pointer",
										boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
									}}
								>
									Done
								</motion.button>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
			<ReviewDrawer
				isOpen={showReview}
				onClose={() => setShowReview(false)}
				outletId={entry.outletId}
				outletName={localOutletName || "the outlet"}
				onSubmitSuccess={() => {
					addToast("Review shared! Thank you.", "success")
					router.push("/home")
				}}
			/>
		</>
	)
}

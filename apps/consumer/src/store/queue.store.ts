import { create } from "zustand"
import { QueueEntry, QueueUpdatePayload } from "@spotly/types"
import api from "@/lib/api"

// Notification permission state
const NOTIF_PERMISSION_KEY = "spotly_notif_permission"

const getStoredPermission = (): NotificationPermission | null => {
	if (typeof window === "undefined") return null
	return localStorage.getItem(
		NOTIF_PERMISSION_KEY,
	) as NotificationPermission | null
}

const setStoredPermission = (permission: NotificationPermission) => {
	if (typeof window === "undefined") return
	localStorage.setItem(NOTIF_PERMISSION_KEY, permission)
}

const seedFromString = (value: string): number => {
	let hash = 0
	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 31 + value.charCodeAt(i)) % 100000
	}
	return Math.abs(hash)
}

const buildDemoQueue = (outletId: string) => {
	const seed = seedFromString(outletId)
	const waitingCount = 4 + (seed % 6)
	const currentToken = 40 + (seed % 20)
	const waitingEntries: QueueEntry[] = Array.from({
		length: waitingCount,
	}).map((_, index) => ({
		id: `demo-entry-${outletId}-${index + 1}`,
		userId: `demo-user-${index + 1}`,
		outletId,
		tokenNumber: currentToken + index + 1,
		status: "WAITING",
		joinedAt: new Date(
			Date.now() - (waitingCount - index) * 2 * 60 * 1000,
		).toISOString(),
	}))

	const calledEntry: QueueEntry = {
		id: `demo-called-${outletId}`,
		userId: "demo-called-user",
		outletId,
		tokenNumber: currentToken,
		status: "CALLED",
		joinedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		calledAt: new Date(Date.now() - 30 * 1000).toISOString(),
	}

	return {
		entries: [calledEntry, ...waitingEntries],
		currentToken,
	}
}

// Play a notification sound using Web Audio API
const playNotificationSound = () => {
	try {
		const audioContext = new (
			window.AudioContext || (window as any).webkitAudioContext
		)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		// Double beep: two high-pitched sounds
		oscillator.frequency.value = 800
		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + 0.1,
		)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.1)

		// Second beep
		const osc2 = audioContext.createOscillator()
		osc2.connect(gainNode)
		oscillator.frequency.value = 1000
		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15)
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + 0.25,
		)

		osc2.start(audioContext.currentTime + 0.15)
		osc2.stop(audioContext.currentTime + 0.25)
	} catch {
		// Silently fail if Web Audio API not available
	}
}

interface QueueState {
	entries: QueueEntry[]
	currentToken: number
	myEntry: QueueEntry | null
	loading: boolean
	notificationPermission: NotificationPermission | null
	avgWaitPerPerson: number // seconds
	outletName: string | null // for "almost your turn" notification

	fetchQueue: (outletId: string) => Promise<void>
	joinQueue: (outletId: string, outletName?: string) => Promise<QueueEntry>
	leaveQueue: (entryId: string) => Promise<void>
	handleQueueUpdate: (payload: QueueUpdatePayload) => void
	handleTokenCalled: (tokenNumber: number) => void
	requestNotificationPermission: () => Promise<NotificationPermission>
}

export const useQueueStore = create<QueueState>()((set, get) => ({
	entries: [],
	currentToken: 0,
	myEntry: null,
	loading: false,
	notificationPermission:
		typeof window !== "undefined" ? getStoredPermission() : null,
	avgWaitPerPerson: 300, // default 5 minutes
	outletName: null,

	fetchQueue: async (outletId: string) => {
		set({ loading: true })
		try {
			const res = await api.get(`/queue/${outletId}`)
			const { entries, avgWaitPerPerson, outletName } = res.data.data
			set({
				entries,
				avgWaitPerPerson: avgWaitPerPerson ?? 300,
				outletName: outletName ?? null,
				loading: false,
			})
		} catch {
			set({
				entries: [],
				currentToken: 0,
				avgWaitPerPerson: 300,
				loading: false,
			})
		}
	},

	joinQueue: async (outletId: string, outletName?: string) => {
		const { requestNotificationPermission } = get()

		try {
			// Request notification permission at join time (not on page load)
			await requestNotificationPermission()

			const res = await api.post("/queue/join", { outletId })
			const entry: QueueEntry = res.data.data
			set({ myEntry: entry, outletName: outletName ?? null })
			return entry
		} catch (err: unknown) {
			throw err instanceof Error ? err : new Error("Failed to join queue")
		}
	},

	requestNotificationPermission: async () => {
		if (typeof window === "undefined" || !("Notification" in window)) {
			return "denied" as NotificationPermission
		}

		// Check if already granted/denied
		const stored = getStoredPermission()
		if (stored === "granted") {
			set({ notificationPermission: "granted" })
			return "granted"
		}

		// Request permission
		const permission = await Notification.requestPermission()
		setStoredPermission(permission)
		set({ notificationPermission: permission })
		return permission
	},

	leaveQueue: async (entryId: string) => {
		if (entryId.startsWith("mock-")) {
			const { entries } = get()
			set({
				entries: entries.filter((e) => e.id !== entryId),
				myEntry: null,
			})
			return
		}

		await api.delete(`/queue/leave/${entryId}`)
		set({ myEntry: null })
	},

	handleQueueUpdate: (payload: QueueUpdatePayload) => {
		const { myEntry, outletName, notificationPermission } = get()
		const updatedMyEntry = myEntry
			? (payload.entries.find((e) => e.id === myEntry.id) ?? myEntry)
			: null

		// Calculate ahead count
		let ahead = 0
		if (updatedMyEntry && updatedMyEntry.status === "WAITING") {
			ahead = payload.entries.filter(
				(e) =>
					e.status === "WAITING" &&
					e.tokenNumber < updatedMyEntry.tokenNumber,
			).length
		}

		// "Almost your turn" notification when ahead === 1
		if (ahead === 1 && notificationPermission === "granted" && outletName) {
			// Only show if we haven't shown it yet for this entry
			const shownKey = `almost_shown_${updatedMyEntry?.id}`
			if (
				typeof window !== "undefined" &&
				!sessionStorage.getItem(shownKey)
			) {
				sessionStorage.setItem(shownKey, "true")
				new Notification("⏳ Almost Your Turn!", {
					body: `You're next! Head to ${outletName}`,
					icon: "/logo.png",
					tag: "almost_your_turn",
				})
			}
		}

		set({
			entries: payload.entries,
			currentToken: payload.currentToken,
			myEntry: updatedMyEntry,
		})
	},

	handleTokenCalled: (tokenNumber: number) => {
		const { myEntry } = get()

		if (myEntry && myEntry.tokenNumber === tokenNumber) {
			// Update entry status
			const updated = { ...myEntry, status: "CALLED" as const }
			set({ myEntry: updated })

			// Browser notification
			if (
				"Notification" in window &&
				Notification.permission === "granted"
			) {
				new Notification("🎉 Your Turn!", {
					body: `Token ${tokenNumber} - Please proceed to the counter`,
					icon: "/logo.png",
					tag: "token_called",
					requireInteraction: true,
				})
			}

			// Play notification sound
			playNotificationSound()

			// Vibration (if supported)
			if ("vibrate" in navigator) {
				navigator.vibrate([200, 100, 200])
			}

			console.log(`✅ Token ${tokenNumber} has been called!`)
		}
	},
}))

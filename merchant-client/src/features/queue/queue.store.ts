import { create } from "zustand"
import api from "@/lib/api"
import { Outlet, QueueEntry } from "@spotly/types"

export type ExtendedQueueStatus =
	| "WAITING"
	| "CALLED"
	| "SERVED"
	| "MISSED"
	| "PENDING_ACCEPTANCE"
	| "CANCELLED"

export type ExtendedQueueEntry = Omit<QueueEntry, "status"> & {
	status: ExtendedQueueStatus
	userName?: string
}

interface QueueStore {
	// ─── Outlet ───────────────────────────────────────────────────────────
	outlets: Outlet[]
	selectedOutletId: string
	isOpen: boolean

	// ─── Queue ────────────────────────────────────────────────────────────
	entries: ExtendedQueueEntry[]
	wsConnected: boolean
	loading: boolean

	// ─── Actions ─────────────────────────────────────────────────────────
	fetchOutlets: (merchantId: string) => Promise<void>
	setSelectedOutletId: (id: string) => void
	fetchQueue: () => Promise<void>
	callNext: () => Promise<void>
	markServed: (entryId: string) => Promise<void>
	rejectEntry: (entryId: string) => Promise<void>
	acceptEntry: (entryId: string) => Promise<void>
	toggleOpen: () => void
	connectRealtime: () => void
	disconnectRealtime: () => void

	// ─── Internal ─────────────────────────────────────────────────────────
	_cleanup: (() => void) | null
	_addToast: ((msg: string, type: string) => void) | null
	setToastFn: (fn: (msg: string, type: string) => void) => void
}

export const useQueueStore = create<QueueStore>((set, get) => ({
	outlets: [],
	selectedOutletId: "",
	isOpen: true,
	entries: [],
	wsConnected: false,
	loading: false,
	_cleanup: null,
	_addToast: null,

	setToastFn: (fn) => set({ _addToast: fn }),

	fetchOutlets: async (merchantId: string) => {
		set({ loading: true })
		try {
			const res = await api.get(`/outlet/merchant/${merchantId}`)
			const data: Outlet[] = res.data.data || []
			set({ outlets: data })
			if (data.length > 0 && !get().selectedOutletId) {
				set({
					selectedOutletId: data[0].id,
					isOpen: data[0].isActive ?? true,
				})
				await get().fetchQueue()
			}
		} catch {
			get()._addToast?.("Failed to load outlets", "error")
		} finally {
			set({ loading: false })
		}
	},

	setSelectedOutletId: (id: string) => {
		const selectedOutlet = get().outlets.find((outlet) => outlet.id === id)
		set({
			selectedOutletId: id,
			entries: [],
			isOpen: selectedOutlet?.isActive ?? true,
		})
		// Re-subscribe to the new outlet's channel
		get().disconnectRealtime()
		get().fetchQueue()
		get().connectRealtime()
	},

	fetchQueue: async () => {
		const { selectedOutletId } = get()
		if (!selectedOutletId) return
		try {
			const res = await api.get(`/queue/${selectedOutletId}`)
			const data: ExtendedQueueEntry[] = res.data.data || []
			set({ entries: data })
		} catch {
			// Realtime will bring updates; silently skip
		}
	},

	callNext: async () => {
		const { selectedOutletId } = get()
		if (!selectedOutletId) return
		try {
			await api.post(`/queue/outlet/${selectedOutletId}/advance`)
			get()._addToast?.("Next token called!", "success")
			get().fetchQueue()
		} catch {
			get()._addToast?.("Failed to call next", "error")
		}
	},

	markServed: async (entryId: string) => {
		try {
			await api.patch(`/queue/entry/${entryId}/served`, {
				outletId: get().selectedOutletId,
			})
			get()._addToast?.("Marked as served", "success")
			get().fetchQueue()
		} catch {
			get()._addToast?.("Failed to mark served", "error")
		}
	},

	rejectEntry: async (entryId: string) => {
		try {
			await api.patch(`/queue/entry/${entryId}/reject`, {
				outletId: get().selectedOutletId,
			})
			get()._addToast?.("Entry rejected", "info")
			get().fetchQueue()
		} catch {
			get()._addToast?.("Failed to reject entry", "error")
		}
	},

	acceptEntry: async (entryId: string) => {
		try {
			await api.patch(`/queue/entry/${entryId}/accept`, {
				outletId: get().selectedOutletId,
			})
			get()._addToast?.("Entry accepted", "success")
			get().fetchQueue()
		} catch {
			get()._addToast?.("Failed to accept entry", "error")
		}
	},

	toggleOpen: async () => {
		const { isOpen, selectedOutletId } = get()
		set({ isOpen: !isOpen })
		get()._addToast?.(`Outlet ${!isOpen ? "opened" : "closed"}`, "info")

		if (selectedOutletId) {
			try {
				await api.patch(
					`/outlet/${selectedOutletId}/active?active=${!isOpen}`,
				)
			} catch {
				set({ isOpen })
				get()._addToast?.("Failed to update outlet status", "error")
			}
		}
	},

	connectRealtime: () => {
		const { selectedOutletId, _cleanup } = get()
		if (_cleanup) return // already subscribed
		if (!selectedOutletId) return

		// Dynamic import to avoid SSR issues (Next.js)
		import("@/lib/socket").then(({ subscribeToOutlet }) => {
			const cleanup = subscribeToOutlet(
				selectedOutletId,
				{
					onQueueUpdate: (payload) => {
						set({ entries: payload.entries || [] })
					},
					onTokenCalled: (payload) => {
						if (payload.outletId === get().selectedOutletId) {
							get()._addToast?.(
								`Token #${payload.tokenNumber} is being called`,
								"info",
							)
						}
					},
				},
				() => {
					// Called when subscription is confirmed
					set({ wsConnected: true })
				},
			)

			set({ _cleanup: cleanup })
		})
	},

	disconnectRealtime: () => {
		const { _cleanup } = get()
		if (_cleanup) {
			_cleanup()
			set({ _cleanup: null, wsConnected: false })
		}
	},
}))

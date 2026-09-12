import { create } from "zustand";
import api from "@/lib/api";
import type { ToastType } from "@spotly/ui";
import { Outlet, QueueEntry } from "@spotly/types";

export type ExtendedQueueStatus =
  | "WAITING"
  | "CALLED"
  | "SERVED"
  | "MISSED"
  | "PENDING_ACCEPTANCE"
  | "CANCELLED";

export type ExtendedQueueEntry = Omit<QueueEntry, "status" | "userId"> & {
  status: ExtendedQueueStatus;
  userName?: string;
};

interface QueueStore {
  // ─── Outlet ───────────────────────────────────────────────────────────
  outlets: Outlet[];
  selectedOutletId: string;
  isOpen: boolean;

  // ─── Queue ────────────────────────────────────────────────────────────
  entries: ExtendedQueueEntry[];
  wsConnected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  stale: boolean;
  mutationPending: boolean;

  // ─── Actions ─────────────────────────────────────────────────────────
  fetchOutlets: (merchantId: string) => Promise<void>;
  setSelectedOutletId: (id: string) => void;
  fetchQueue: () => Promise<void>;
  callNext: () => Promise<void>;
  markServed: (entryId: string) => Promise<void>;
  markMissed: (entryId: string) => Promise<void>;
  rejectEntry: (entryId: string) => Promise<void>;
  acceptEntry: (entryId: string) => Promise<void>;
  toggleOpen: () => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;

  // ─── Internal ─────────────────────────────────────────────────────────
  _cleanup: (() => void) | null;
  _addToast: ((msg: string, type: ToastType) => void) | null;
  setToastFn: (fn: (msg: string, type: ToastType) => void) => void;
}

let subscriptionVersion = 0;
let readVersion = 0;

export const useQueueStore = create<QueueStore>((set, get) => ({
  outlets: [],
  selectedOutletId: "",
  isOpen: true,
  entries: [],
  wsConnected: false,
  loading: false,
  error: null,
  lastUpdated: null,
  stale: false,
  mutationPending: false,
  _cleanup: null,
  _addToast: null,

  setToastFn: (fn) => set({ _addToast: fn }),

  fetchOutlets: async (merchantId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/outlet/merchant/${merchantId}`);
      const data: Outlet[] = res.data.data || [];
      set({ outlets: data, isOpen: data.find((outlet) => outlet.id === get().selectedOutletId)?.isActive ?? false });
      if (!data.some((outlet) => outlet.id === get().selectedOutletId)) {
        set({
          selectedOutletId: data[0]?.id || "",
          entries: [],
          isOpen: data[0]?.isActive ?? false,
        });
        await get().fetchQueue();
      }
    } catch {
      set({ error: "Failed to load outlets" });
      get()._addToast?.("Failed to load outlets", "error");
    } finally {
      set({ loading: false });
    }
  },

  setSelectedOutletId: (id: string) => {
    if (id === get().selectedOutletId) return;
    const selectedOutlet = get().outlets.find((outlet) => outlet.id === id);
    if (!selectedOutlet) return;
    set({
      selectedOutletId: id,
      entries: [],
      isOpen: selectedOutlet?.isActive ?? true,
      error: null,
      stale: false,
      lastUpdated: null,
    });
    // Re-subscribe to the new outlet's channel
    get().disconnectRealtime();
    get().fetchQueue();
    get().connectRealtime();
  },

  fetchQueue: async () => {
    const { selectedOutletId } = get();
    if (!selectedOutletId) return;
    const version = ++readVersion;
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/queue/outlet/${selectedOutletId}`);
      const data: ExtendedQueueEntry[] = res.data.data || [];
      if (
        selectedOutletId !== get().selectedOutletId ||
        version !== readVersion
      ) {
        return;
      }
      set({
        entries: data,
        loading: false,
        error: null,
        stale: false,
        lastUpdated: Date.now(),
      });
    } catch {
      if (
        selectedOutletId === get().selectedOutletId &&
        version === readVersion
      )
        set({
          loading: false,
          error: "Queue could not be refreshed",
          stale: true,
        });
    }
  },

  callNext: async () => {
    const { selectedOutletId } = get();
    if (!selectedOutletId) return;
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      await api.post(`/queue/outlet/${selectedOutletId}/advance`);
      get()._addToast?.("Next token called!", "success");
      await get().fetchQueue();
    } catch {
      await get().fetchQueue();
      get()._addToast?.(
        "Failed to call next. Queue refreshed; check the current state before retrying.",
        "error",
      );
      throw new Error("Failed to call next");
    } finally {
      set({ mutationPending: false });
    }
  },

  markServed: async (entryId: string) => {
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      await api.patch(`/queue/entry/${entryId}/served`, {
        outletId: get().selectedOutletId,
      });
      get()._addToast?.("Marked as served", "success");
      await get().fetchQueue();
    } catch {
      await get().fetchQueue();
      get()._addToast?.(
        "Failed to mark served. Queue refreshed; check the current state before retrying.",
        "error",
      );
      throw new Error("Failed to mark served");
    } finally {
      set({ mutationPending: false });
    }
  },

  markMissed: async (entryId: string) => {
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      await api.patch(`/queue/entry/${entryId}/missed`, {
        outletId: get().selectedOutletId,
      });
      get()._addToast?.("Marked as missed", "info");
      await get().fetchQueue();
    } catch {
      await get().fetchQueue();
      get()._addToast?.(
        "Failed to mark missed. Queue refreshed; check the current state before retrying.",
        "error",
      );
      throw new Error("Failed to mark missed");
    } finally {
      set({ mutationPending: false });
    }
  },

  rejectEntry: async (entryId: string) => {
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      await api.patch(`/queue/entry/${entryId}/reject`, {
        outletId: get().selectedOutletId,
      });
      get()._addToast?.("Entry rejected", "info");
      await get().fetchQueue();
    } catch {
      await get().fetchQueue();
      get()._addToast?.(
        "Failed to reject entry. Queue refreshed; check the current state before retrying.",
        "error",
      );
      throw new Error("Failed to reject entry");
    } finally {
      set({ mutationPending: false });
    }
  },

  acceptEntry: async (entryId: string) => {
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      await api.patch(`/queue/entry/${entryId}/accept`, {
        outletId: get().selectedOutletId,
      });
      get()._addToast?.("Entry accepted", "success");
      await get().fetchQueue();
    } catch {
      await get().fetchQueue();
      get()._addToast?.(
        "Failed to accept entry. Queue refreshed; check the current state before retrying.",
        "error",
      );
      throw new Error("Failed to accept entry");
    } finally {
      set({ mutationPending: false });
    }
  },

  toggleOpen: async () => {
    const { isOpen, selectedOutletId } = get();
    if (
      get().mutationPending ||
      get().loading ||
      get().stale ||
      !get().selectedOutletId
    )
      return;
    set({ mutationPending: true });
    try {
      if (selectedOutletId) {
        await api.patch(`/outlet/${selectedOutletId}/active?active=${!isOpen}`);
        set({
          ...(get().selectedOutletId === selectedOutletId
            ? { isOpen: !isOpen }
            : {}),
          outlets: get().outlets.map((outlet) =>
            outlet.id === selectedOutletId
              ? { ...outlet, isActive: !isOpen }
              : outlet,
          ),
        });
        get()._addToast?.(`Outlet ${!isOpen ? "opened" : "paused"}`, "info");
      }
    } catch {
      get()._addToast?.("Failed to update outlet status", "error");
      throw new Error("Failed to update outlet status");
    } finally {
      set({ mutationPending: false });
    }
  },

  connectRealtime: () => {
    const { selectedOutletId, _cleanup } = get();
    if (_cleanup) return; // already subscribed
    if (!selectedOutletId) return;

    const version = ++subscriptionVersion;
    // Dynamic import to avoid SSR issues (Next.js)
    import("@/lib/socket").then(({ subscribeToOutlet }) => {
      if (
        version !== subscriptionVersion ||
        selectedOutletId !== get().selectedOutletId ||
        get()._cleanup
      )
        return;
      const cleanup = subscribeToOutlet(
        selectedOutletId,
        {
          onQueueUpdate: (payload) => {
            if (payload.outletId !== get().selectedOutletId) return;
            readVersion += 1;
            set({
              loading: false,
              entries: payload.entries || [],
              error: null,
              stale: false,
              lastUpdated: Date.now(),
            });
          },
          onTokenCalled: (payload) => {
            if (payload.outletId === get().selectedOutletId) {
              get()._addToast?.(
                `Token #${payload.tokenNumber} is being called`,
                "info",
              );
            }
          },
        },
        () => {
          // Called when subscription is confirmed
          if (selectedOutletId !== get().selectedOutletId) return;
          set({ wsConnected: true });
          void get().fetchQueue();
        },
        () => {
          if (selectedOutletId === get().selectedOutletId)
            set({
              wsConnected: false,
              stale: true,
              error: "Live updates unavailable. Refresh before making changes.",
            });
        },
      );

      set({ _cleanup: cleanup });
    });
  },

  disconnectRealtime: () => {
    subscriptionVersion += 1;
    const { _cleanup } = get();
    if (_cleanup) {
      _cleanup();
      set({ _cleanup: null, wsConnected: false });
    }
  },
}));

import { create } from "zustand";
import { QueueEntry, QueueUpdatePayload } from "@spotly/types";
import api from "@/lib/api";

interface QueueState {
  entries: QueueUpdatePayload["entries"];
  myEntry: QueueEntry | null;
  loading: boolean;
  error: string | null;

  joinQueue: (outletId: string) => Promise<QueueEntry>;
  leaveQueue: (entryId: string) => Promise<void>;
  fetchActiveEntry: () => Promise<QueueEntry | null>;
  clearActive: () => void;
  handleQueueUpdate: (payload: QueueUpdatePayload) => void;
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  entries: [],
  myEntry: null,
  loading: false,
  error: null,

  joinQueue: async (outletId: string) => {
    try {
      const res = await api.post("/queue/join", { outletId });
      const entry: QueueEntry = res.data.data;
      set({ myEntry: entry, error: null });
      return entry;
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error("Failed to join queue");
    }
  },

  leaveQueue: async (entryId: string) => {
    await api.patch(`/queue/entry/${entryId}/leave`);
    set({ myEntry: null, error: null });
  },

  fetchActiveEntry: async () => {
    try {
      const res = await api.get("/queue/active");
      const entry: QueueEntry | null = res.data.data;
      set({ myEntry: entry, error: null });
      return entry;
    } catch {
      set({ error: "Your active request could not be refreshed" });
      return get().myEntry;
    }
  },

  clearActive: () => set({ myEntry: null }),

  handleQueueUpdate: (payload: QueueUpdatePayload) => {
    const { myEntry } = get();
    const update = payload.entries.find((e) => e.id === myEntry?.id);
    const updatedMyEntry =
      myEntry?.outletId === payload.outletId
        ? update
          ? { ...myEntry, ...update }
          : myEntry
        : myEntry;
    set({
      entries: payload.entries,
      myEntry: updatedMyEntry,
    });
  },
}));

export function waitingAhead(
  entries: QueueUpdatePayload["entries"],
  current: { id: string; outletId: string },
): number | null {
  const index = entries
    .filter(
      (entry) =>
        entry.outletId === current.outletId && entry.status === "WAITING",
    )
    .findIndex((entry) => entry.id === current.id);
  return index < 0 ? null : index;
}

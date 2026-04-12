import { create } from 'zustand';
import { QueueEntry, QueueUpdatePayload } from '@spotly/types';
import api from '@/lib/api';

interface QueueState {
  entries: QueueEntry[];
  currentToken: number;
  myEntry: QueueEntry | null;
  loading: boolean;

  fetchQueue: (outletId: string) => Promise<void>;
  joinQueue: (outletId: string) => Promise<QueueEntry>;
  leaveQueue: (entryId: string) => Promise<void>;
  handleQueueUpdate: (payload: QueueUpdatePayload) => void;
  handleTokenCalled: (tokenNumber: number) => void;
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  entries: [],
  currentToken: 0,
  myEntry: null,
  loading: false,

  fetchQueue: async (outletId: string) => {
    set({ loading: true });
    const res = await api.get(`/queue/${outletId}`);
    set({ entries: res.data.data, loading: false });
  },

  joinQueue: async (outletId: string) => {
    const res = await api.post('/queue/join', { outletId });
    const entry: QueueEntry = res.data.data;
    set({ myEntry: entry });
    return entry;
  },

  leaveQueue: async (entryId: string) => {
    await api.delete(`/queue/leave/${entryId}`);
    set({ myEntry: null });
  },

  handleQueueUpdate: (payload: QueueUpdatePayload) => {
    const { myEntry } = get();
    const updatedMyEntry = myEntry
      ? payload.entries.find((e) => e.id === myEntry.id) ?? myEntry
      : null;
    set({
      entries: payload.entries,
      currentToken: payload.currentToken,
      myEntry: updatedMyEntry,
    });
  },

  handleTokenCalled: (tokenNumber: number) => {
    // Could trigger a browser notification here
    console.log(`Token ${tokenNumber} has been called!`);
  },
}));

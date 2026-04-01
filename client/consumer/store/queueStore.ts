import { create } from 'zustand';
import type { QueueEntry } from '../types';

interface QueueState {
  entry: QueueEntry | null;
  loading: boolean;
  error: string | null;
  setEntry: (e: QueueEntry | null) => void;
  updatePosition: (position: number) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  entry: null,
  loading: false,
  error: null,
  setEntry: (entry) => set({ entry }),
  updatePosition: (position) =>
    set((s) => ({ entry: s.entry ? { ...s.entry, position } : null })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ entry: null, loading: false, error: null }),
}));

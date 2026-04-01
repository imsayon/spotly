import { create } from 'zustand';
import type { QueueState } from '../types';

interface MerchantQueueState {
  queueState: QueueState | null;
  loading: boolean;
  error: string | null;
  setQueueState: (s: QueueState) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useQueueStore = create<MerchantQueueState>((set) => ({
  queueState: null,
  loading: false,
  error: null,
  setQueueState: (queueState) => set({ queueState }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

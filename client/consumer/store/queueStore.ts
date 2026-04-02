import { create } from 'zustand';
import type { QueueEntry, QueueStatus } from '../types';
import { queueApi } from '../services/api';

interface QueueStoreState {
  // State
  entry: QueueEntry | null;
  loading: boolean;
  error: string | null;
  currentMerchantId: string | null;
  socketConnected: boolean;
  lastUpdate: number | null;

  // Position tracking
  position: number | null;
  eta: number | null; // in minutes
  status: QueueStatus | null;

  // Actions
  setEntry: (e: QueueEntry | null) => void;
  updatePosition: (position: number, eta?: number) => void;
  setStatus: (status: QueueStatus) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setCurrentMerchant: (merchantId: string | null) => void;
  setSocketConnected: (connected: boolean) => void;
  clearError: () => void;

  // API actions
  joinQueue: (merchantId: string, userId: string) => Promise<QueueEntry>;
  getQueueStatus: (entryId: string) => Promise<QueueEntry>;
  leaveQueue: (entryId: string) => Promise<void>;
  markArrived: (entryId: string, otp: string) => Promise<QueueEntry>;

  // Utilities
  reset: () => void;
  isWaiting: () => boolean;
  isCalled: () => boolean;
  isServed: () => boolean;
  isMissed: () => boolean;
}

/**
 * Queue state management store
 * Tracks user's queue position, status, and real-time updates
 */
export const useQueueStore = create<QueueStoreState>((set, get) => ({
  // Initial state
  entry: null,
  loading: false,
  error: null,
  currentMerchantId: null,
  socketConnected: false,
  lastUpdate: null,
  position: null,
  eta: null,
  status: null,

  // Basic setters
  setEntry: (entry) => {
    set({
      entry,
      position: entry?.position ?? null,
      status: entry?.status ?? null,
      eta: entry?.eta ?? null,
      lastUpdate: Date.now(),
    });
  },

  updatePosition: (position, eta) => {
    set((state) => ({
      position,
      eta: eta ?? state.eta,
      lastUpdate: Date.now(),
      entry: state.entry
        ? {
            ...state.entry,
            position,
            eta: eta ?? state.eta,
          }
        : null,
    }));
  },

  setStatus: (status) => {
    set((state) => ({
      status,
      entry: state.entry ? { ...state.entry, status } : null,
    }));
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setCurrentMerchant: (merchantId) => set({ currentMerchantId: merchantId }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),

  // API actions
  joinQueue: async (merchantId: string, userId: string) => {
    const { setLoading, setError, setEntry, setCurrentMerchant } = get();
    setLoading(true);
    setError(null);

    try {
      const entry = await queueApi.join(merchantId, userId);
      setEntry(entry);
      setCurrentMerchant(merchantId);
      setLoading(false);
      return entry;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join queue';
      setError(errorMsg);
      throw err;
    }
  },

  getQueueStatus: async (entryId: string) => {
    try {
      const entry = await queueApi.getStatus(entryId);
      get().setEntry(entry);
      return entry;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get status';
      get().setError(errorMsg);
      throw err;
    }
  },

  leaveQueue: async (entryId: string) => {
    const { setLoading, setError, reset } = get();
    setLoading(true);
    setError(null);

    try {
      await queueApi.leave(entryId);
      reset();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to leave queue';
      setError(errorMsg);
      throw err;
    }
  },

  markArrived: async (entryId: string, otp: string) => {
    const { setLoading, setError, setEntry, setStatus } = get();
    setLoading(true);
    setError(null);

    try {
      const entry = await queueApi.markArrived(entryId, otp);
      setEntry(entry);
      setStatus('SERVED');
      setLoading(false);
      return entry;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to mark as arrived';
      setError(errorMsg);
      throw err;
    }
  },

  // Utility methods
  reset: () =>
    set({
      entry: null,
      loading: false,
      error: null,
      currentMerchantId: null,
      socketConnected: false,
      position: null,
      eta: null,
      status: null,
      lastUpdate: null,
    }),

  isWaiting: () => get().status === 'WAITING',
  isCalled: () => get().status === 'CALLED',
  isServed: () => get().status === 'SERVED',
  isMissed: () => get().status === 'MISSED',
}));

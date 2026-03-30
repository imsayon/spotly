import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // ========== Consumer State ==========
  user: {
    id: null,
    name: null,
    email: null,
  },
  setUser: (user) => set({ user }),

  // Current queue info
  currentQueue: null,
  setCurrentQueue: (queue) => set({ currentQueue: queue }),

  // User's position in queue
  position: null,
  setPosition: (position) => set({ position }),

  // Queue status (waiting / served / completed / etc)
  status: null, // 'waiting' | 'served' | 'completed' | 'cancelled'
  setStatus: (status) => set({ status }),

  // ========== Merchant State ==========
  queueList: [],
  setQueueList: (queues) => set({ queueList: queues }),

  activeToken: null,
  setActiveToken: (token) => set({ activeToken: token }),

  merchantStats: {
    totalUsers: 0,
    usersServed: 0,
    avgWaitTime: 0,
  },
  setMerchantStats: (stats) => set({ merchantStats: stats }),

  // ========== UI State ==========
  loading: false,
  setLoading: (loading) => set({ loading }),

  error: null,
  setError: (error) => set({ error }),

  // ========== Real-time Updates ==========
  queueUpdated: null, // timestamp of last update
  setQueueUpdated: (timestamp) => set({ queueUpdated: timestamp }),

  positionChanged: null, // new position
  setPositionChanged: (position) => set({ 
    position, 
    positionChanged: position 
  }),

  queueAdvanced: null, // advanced user info
  setQueueAdvanced: (user) => set({ queueAdvanced: user }),

  // ========== Utility Functions ==========
  // Reset consumer state
  resetConsumerState: () => set({
    currentQueue: null,
    position: null,
    status: null,
  }),

  // Reset merchant state
  resetMerchantState: () => set({
    queueList: [],
    activeToken: null,
    merchantStats: {
      totalUsers: 0,
      usersServed: 0,
      avgWaitTime: 0,
    },
  }),

  // Clear all errors
  clearError: () => set({ error: null }),

  // Clear all state
  clearAll: () => set({
    user: { id: null, name: null, email: null },
    currentQueue: null,
    position: null,
    status: null,
    queueList: [],
    activeToken: null,
    merchantStats: {
      totalUsers: 0,
      usersServed: 0,
      avgWaitTime: 0,
    },
    loading: false,
    error: null,
    queueUpdated: null,
    positionChanged: null,
    queueAdvanced: null,
  }),
}));

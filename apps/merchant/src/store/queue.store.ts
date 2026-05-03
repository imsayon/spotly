import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { Outlet, QueueEntry } from '@spotly/types';

// Extend QueueStatus to include the PENDING_ACCEPTANCE state that
// Firestore emits before a merchant accepts/rejects a join.
export type ExtendedQueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVED'
  | 'MISSED'
  | 'PENDING_ACCEPTANCE';

export type ExtendedQueueEntry = Omit<QueueEntry, 'status'> & {
  status: ExtendedQueueStatus;
  userName?: string;
};

interface QueueStore {
  // ─── Outlet ───────────────────────────────────────────────────────────
  outlets: Outlet[];
  selectedOutletId: string;
  isOpen: boolean; // local-only (no PATCH /outlet/:id in API contract)

  // ─── Queue ────────────────────────────────────────────────────────────
  entries: ExtendedQueueEntry[];
  wsConnected: boolean;
  loading: boolean;

  // ─── Derived helpers ──────────────────────────────────────────────────
  // (computed getters available from store)

  // ─── Actions ─────────────────────────────────────────────────────────
  fetchOutlets: (merchantId: string) => Promise<void>;
  setSelectedOutletId: (id: string) => void;
  fetchQueue: () => Promise<void>;
  callNext: () => Promise<void>;
  markServed: (entryId: string) => Promise<void>;
  rejectEntry: (entryId: string) => Promise<void>;
  acceptEntry: (entryId: string) => Promise<void>;
  toggleOpen: () => void;
  connectSocket: () => void;
  disconnectSocket: () => void;

  // ─── Internal ─────────────────────────────────────────────────────────
  _socket: Socket | null;
  _addToast: ((msg: string, type: string) => void) | null;
  setToastFn: (fn: (msg: string, type: string) => void) => void;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  outlets: [],
  selectedOutletId: '',
  isOpen: true,
  entries: [],
  wsConnected: false,
  loading: false,
  _socket: null,
  _addToast: null,

  setToastFn: (fn) => set({ _addToast: fn }),

  fetchOutlets: async (merchantId: string) => {
    set({ loading: true });
    try {
      const res = await api.get(`/outlet/merchant/${merchantId}`);
      const data: Outlet[] = res.data.data || [];
      set({ outlets: data });
      if (data.length > 0 && !get().selectedOutletId) {
        set({ selectedOutletId: data[0].id, isOpen: data[0].isActive ?? true });
        await get().fetchQueue();
      }
    } catch {
      get()._addToast?.('Failed to load outlets', 'error');
    } finally {
      set({ loading: false });
    }
  },

  setSelectedOutletId: (id: string) => {
    const { _socket, selectedOutletId } = get();
    // Leave old room, join new
    if (_socket && selectedOutletId) {
      _socket.emit('leave_outlet', { outletId: selectedOutletId });
    }
    const selectedOutlet = get().outlets.find((outlet) => outlet.id === id);
    set({ selectedOutletId: id, entries: [], isOpen: selectedOutlet?.isActive ?? true });
    get().fetchQueue();
    if (_socket) {
      _socket.emit('join_outlet', { outletId: id });
    }
  },

  fetchQueue: async () => {
    const { selectedOutletId } = get();
    if (!selectedOutletId) return;
    try {
      const res = await api.get(`/queue/${selectedOutletId}`);
      const data: ExtendedQueueEntry[] = res.data.data || [];
      set({ entries: data });
    } catch {
      // WS will bring updates; silently skip
    }
  },

  callNext: async () => {
    const { selectedOutletId } = get();
    if (!selectedOutletId) return;
    try {
      await api.post('/queue/next', { outletId: selectedOutletId });
      get()._addToast?.('Next token called!', 'success');
      get().fetchQueue();
    } catch {
      get()._addToast?.('Failed to call next', 'error');
    }
  },

  markServed: async (entryId: string) => {
    try {
      await api.post(`/queue/served/${entryId}`, { outletId: get().selectedOutletId });
      get()._addToast?.('Marked as served', 'success');
      get().fetchQueue();
    } catch {
      get()._addToast?.('Failed to mark served', 'error');
    }
  },

  rejectEntry: async (entryId: string) => {
    try {
      await api.post(`/queue/missed/${entryId}`, { outletId: get().selectedOutletId });
      get()._addToast?.('Entry rejected', 'info');
      get().fetchQueue();
    } catch {
      get()._addToast?.('Failed to reject entry', 'error');
    }
  },

  acceptEntry: async (entryId: string) => {
    try {
      await api.post(`/queue/accept/${entryId}`, { outletId: get().selectedOutletId });
      get()._addToast?.('Entry accepted', 'success');
      get().fetchQueue();
    } catch {
      get()._addToast?.('Failed to accept entry', 'error');
    }
  },

  toggleOpen: async () => {
    const { isOpen, selectedOutletId } = get();
    // Optimistic update
    set({ isOpen: !isOpen });
    get()._addToast?.(
      `Outlet ${!isOpen ? 'opened' : 'closed'}`,
      'info'
    );
    
    if (selectedOutletId) {
      try {
        await api.patch(`/outlet/${selectedOutletId}`, { isActive: !isOpen });
      } catch {
        // Rollback on fail
        set({ isOpen });
        get()._addToast?.('Failed to update outlet status', 'error');
      }
    }
  },

  connectSocket: () => {
    const { selectedOutletId, _socket } = get();
    if (_socket) return; // already connected

    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001',
      { transports: ['websocket'] }
    );

    socket.on('connect', () => {
      set({ wsConnected: true });
      if (selectedOutletId) {
        socket.emit('join_outlet', { outletId: selectedOutletId });
      }
    });

    socket.on('disconnect', () => set({ wsConnected: false }));

    socket.on('queue_update', (payload: { entries: ExtendedQueueEntry[]; currentToken: number }) => {
      set({ entries: payload.entries || [] });
    });

    socket.on('token_called', (payload: { outletId: string; tokenNumber: number }) => {
      if (payload.outletId === get().selectedOutletId) {
        get()._addToast?.(`Token #${payload.tokenNumber} is being called`, 'info');
      }
    });

    set({ _socket: socket });
  },

  disconnectSocket: () => {
    const { _socket, selectedOutletId } = get();
    if (!_socket) return;
    if (selectedOutletId) {
      _socket.emit('leave_outlet', { outletId: selectedOutletId });
    }
    _socket.disconnect();
    set({ _socket: null, wsConnected: false });
  },
}));

import { create } from 'zustand';
import { QueueEntry, QueueUpdatePayload } from '@spotly/types';
import api from '@/lib/api';

const seedFromString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return Math.abs(hash);
};

const buildDemoQueue = (outletId: string) => {
  const seed = seedFromString(outletId);
  const waitingCount = 4 + (seed % 6);
  const currentToken = 40 + (seed % 20);
  const waitingEntries: QueueEntry[] = Array.from({ length: waitingCount }).map((_, index) => ({
    id: `demo-entry-${outletId}-${index + 1}`,
    userId: `demo-user-${index + 1}`,
    outletId,
    tokenNumber: currentToken + index + 1,
    status: 'WAITING',
    joinedAt: new Date(Date.now() - (waitingCount - index) * 2 * 60 * 1000).toISOString(),
  }));

  const calledEntry: QueueEntry = {
    id: `demo-called-${outletId}`,
    userId: 'demo-called-user',
    outletId,
    tokenNumber: currentToken,
    status: 'CALLED',
    joinedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 30 * 1000).toISOString(),
  };

  return {
    entries: [calledEntry, ...waitingEntries],
    currentToken,
  };
};

// Play a notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Double beep: two high-pitched sounds
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    // Second beep
    const osc2 = audioContext.createOscillator();
    osc2.connect(gainNode);
    oscillator.frequency.value = 1000;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.25);
  } catch {
    // Silently fail if Web Audio API not available
  }
};

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
    try {
      const res = await api.get(`/queue/${outletId}`);
      set({ entries: res.data.data, loading: false });
    } catch {
      const demo = buildDemoQueue(outletId);
      set({ entries: demo.entries, currentToken: demo.currentToken, loading: false });
    }
  },

  joinQueue: async (outletId: string) => {
    if (outletId.startsWith('demo-outlet-') || outletId.includes('osm-') || outletId.includes('demo-')) {
      const demo = buildDemoQueue(outletId);
      const nextToken = demo.currentToken + demo.entries.filter((e) => e.status === 'WAITING').length + 1;
      const mockEntry: QueueEntry = {
        id: `mock-${Date.now()}`,
        userId: 'mock-user',
        outletId,
        tokenNumber: nextToken,
        status: 'WAITING',
        joinedAt: new Date().toISOString(),
      };

      set({
        entries: [...demo.entries, mockEntry],
        currentToken: demo.currentToken,
        myEntry: mockEntry,
      });
      return mockEntry;
    }

    try {
      const res = await api.post('/queue/join', { outletId });
      const entry: QueueEntry = res.data.data;
      set({ myEntry: entry });
      return entry;
    } catch {
      const demo = buildDemoQueue(outletId);
      const nextToken = demo.currentToken + demo.entries.filter((e) => e.status === 'WAITING').length + 1;
        const mockEntry: QueueEntry = {
          id: `mock-${Date.now()}`,
          userId: 'mock-user',
          outletId,
          tokenNumber: nextToken,
          status: 'WAITING',
          joinedAt: new Date().toISOString(),
        };
        set({
          entries: [...demo.entries, mockEntry],
          currentToken: demo.currentToken,
          myEntry: mockEntry,
        });
        return mockEntry;
    }
  },

  leaveQueue: async (entryId: string) => {
    if (entryId.startsWith('mock-')) {
      const { entries } = get();
      set({ entries: entries.filter((e) => e.id !== entryId), myEntry: null });
      return;
    }

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
    const { myEntry } = get();
    
    if (myEntry && myEntry.tokenNumber === tokenNumber) {
      // Update entry status
      const updated = { ...myEntry, status: 'CALLED' as const };
      set({ myEntry: updated });
      
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Your Turn!', {
          body: `Token ${tokenNumber} - Please proceed to the counter`,
          icon: '/logo.png',
          tag: 'token_called',
          requireInteraction: true,
        });
      }
      
      // Play notification sound
      playNotificationSound();
      
      // Vibration (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      console.log(`✅ Token ${tokenNumber} has been called!`);
    }
  },
}));

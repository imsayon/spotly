import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  registerOnBackend: (role?: 'CONSUMER' | 'MERCHANT') => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    set({ user: result.user });
    await get().registerOnBackend();
  },

  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ user: null });
  },

  registerOnBackend: async (role = 'CONSUMER') => {
    try {
      await api.post('/user/register', { role });
    } catch {
      // Silently fail — user already exists
    }
  },
}));

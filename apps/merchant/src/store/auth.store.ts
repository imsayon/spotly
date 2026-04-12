import { create } from 'zustand';
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
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    set({ user: result.user });
    // Register as MERCHANT on backend
    try {
      await api.post('/user/register', { role: 'MERCHANT' });
    } catch { /* already exists */ }
  },

  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ user: null });
  },
}));

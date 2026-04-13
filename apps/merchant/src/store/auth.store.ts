import { create } from 'zustand';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import api from '@/lib/api';

export interface MerchantProfile {
  id: string;
  userId: string;
  name: string;
  category: string;
  phone?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  merchantProfile: MerchantProfile | null;
  loading: boolean;
  setUser: (user: User | null) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchMerchantProfile: () => Promise<MerchantProfile | null>;
  setMerchantProfile: (profile: MerchantProfile) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  merchantProfile: null,
  loading: true,

  setUser: async (user) => {
    if (!user) {
      set({ user: null, merchantProfile: null, loading: false });
      return;
    }
    set({ user, loading: true });
    await get().fetchMerchantProfile();
    set({ loading: false });
  },

  fetchMerchantProfile: async () => {
    try {
      const response = await api.get('/merchant/me/profile');
      set({ merchantProfile: response.data });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err.message === 'Not Found') {
        set({ merchantProfile: null });
        return null; // Doesn't exist yet
      }
      return null;
    }
  },

  setMerchantProfile: (profile) => set({ merchantProfile: profile }),

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    set({ user: result.user, loading: true });
    // Register as MERCHANT on backend
    try {
      await api.post('/user/register', { role: 'MERCHANT' });
    } catch (err: any) {
      // already exists or other error
    }
    await get().fetchMerchantProfile();
    set({ loading: false });
  },

  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ user: null, merchantProfile: null, loading: false });
  },
}));

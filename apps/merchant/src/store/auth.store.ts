import { create } from 'zustand';
import { getFirebaseAuth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import api from '@/lib/api';

export interface MerchantProfile {
  id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  address?: string;
  foundingYear?: number;
  logoUrl?: string;
  gstNumber?: string;
  lat?: number;
  lng?: number;
}

interface AuthState {
  user: FirebaseUser | null;
  merchantProfile: MerchantProfile | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => Promise<void>;
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
      const profile = response.data.data;
      set({ merchantProfile: profile });
      return profile;
    } catch (err: any) {
      if (err?.response?.status === 404 || err.message === 'Not Found') {
        set({ merchantProfile: null });
        return null;
      }
      return null;
    }
  },

  setMerchantProfile: (profile) => set({ merchantProfile: profile }),

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      console.error('Merchant Google Sign-In Error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
      set({ user: null, merchantProfile: null, loading: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Merchant Sign-Out Error:', error);
    }
  },
}));

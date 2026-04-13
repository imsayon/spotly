import { create } from 'zustand';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import api from '@/lib/api';
import { User as BackendUser } from '@spotly/types';

interface AuthState {
  user: FirebaseUser | null;
  profile: BackendUser | null;
  loading: boolean;
  forceOnboarding: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: BackendUser | null) => void;
  setForceOnboarding: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<BackendUser | null>;
  updateProfile: (data: Partial<BackendUser>) => Promise<void>;
  registerOnBackend: (role?: 'CONSUMER' | 'MERCHANT') => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  forceOnboarding: false,

  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),
  setForceOnboarding: (val) => set({ forceOnboarding: val }),

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    set({ user: result.user });
    await get().registerOnBackend();
    await get().fetchProfile();
  },

  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ user: null, profile: null, forceOnboarding: false });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/user/me');
      const profile = res.data.data;
      set({ profile });
      return profile;
    } catch {
      return null;
    }
  },

  updateProfile: async (data) => {
    const res = await api.patch('/user/me', data);
    set({ profile: res.data.data, forceOnboarding: false });
  },

  clearProfile: async () => {
    // Clear data on backend so we can re-trigger onboarding
    await api.patch('/user/me', { name: '', phone: '', location: '' });
    set({ profile: null, forceOnboarding: true });
  },

  registerOnBackend: async (role = 'CONSUMER') => {
    try {
      await api.post('/user/register', { role });
    } catch {
      // Silently fail — user already exists
    }
  },
}));

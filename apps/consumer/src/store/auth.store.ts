import { create } from 'zustand';
import { getFirebaseAuth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
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
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(getFirebaseAuth());
      set({ user: null, profile: null, forceOnboarding: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
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
    try {
      const res = await api.patch('/user/me', data);
      set({ profile: res.data.data, forceOnboarding: false });
    } catch (error) {
      await get().registerOnBackend('CONSUMER');
      const res = await api.patch('/user/me', data);
      set({ profile: res.data.data, forceOnboarding: false });
    }
  },

  clearProfile: async () => {
    await api.patch('/user/me', { name: '', phone: '', location: '' });
    set({ profile: null, forceOnboarding: true });
  },

  registerOnBackend: async (role = 'CONSUMER') => {
    try {
      await api.post('/user/register', { role });
    } catch {
      // Silently fail
    }
  },
}));

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import api from '@/lib/api';
import { User as BackendUser } from '@spotly/types';

interface AuthState {
  user: SupabaseUser | null;
  profile: BackendUser | null;
  loading: boolean;
  forceOnboarding: boolean;
  setUser: (user: SupabaseUser | null) => void;
  setProfile: (profile: BackendUser | null) => void;
  setForceOnboarding: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Email Sign-In Error:', error);
      throw error;
    }
  },

  signUpWithEmail: async (email, password, name) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name?.trim() || '',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Email Sign-Up Error:', error);
      throw error;
    }
  },

  sendOtp: async (phone) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
    } catch (error) {
      console.error('Send OTP Error:', error);
      throw error;
    }
  },

  verifyOtp: async (phone, token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw error;
    } catch (error) {
      console.error('Verify OTP Error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
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

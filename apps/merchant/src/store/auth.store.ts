import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import api from '@/lib/api';

export interface MerchantProfile {
  id: string;
  ownerId: string;
  spotId?: string;
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
  outlets?: any[];
}

interface AuthState {
  user: SupabaseUser | null;
  merchantProfile: MerchantProfile | null;
  loading: boolean;
  setUser: (user: SupabaseUser | null) => Promise<void>;
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
    const hadProfile = !!get().merchantProfile;
    set({ user, loading: !hadProfile });
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
      console.error('[AuthStore] fetchMerchantProfile Error:', err);
      return null;
    }
  },

  setMerchantProfile: (profile) => set({ merchantProfile: profile }),

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      console.error('Merchant Google Sign-In Error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, merchantProfile: null, loading: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Merchant Sign-Out Error:', error);
    }
  },
}));

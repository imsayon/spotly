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
  registerOnBackend: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchMerchantProfile: () => Promise<MerchantProfile | null>;
  setMerchantProfile: (profile: MerchantProfile) => void;
}

let setUserPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  merchantProfile: null,
  loading: true,

  setUser: async (user) => {
    if (setUserPromise) {
      await setUserPromise;
    }
    
    setUserPromise = (async () => {
      if (!user) {
        set({ user: null, merchantProfile: null, loading: false });
        return;
      }
      
      // If the same user is already loaded, skip
      if (get().user?.id === user.id && get().merchantProfile !== null) {
        set({ user, loading: false });
        return;
      }

      const hadProfile = !!get().merchantProfile;
      set({ user, loading: !hadProfile });
      // Ensure user record exists on backend before fetching merchant profile
      await get().registerOnBackend();
      await get().fetchMerchantProfile();
      set({ loading: false });
    })();

    await setUserPromise;
    setUserPromise = null;
  },

  registerOnBackend: async () => {
    try {
      await api.post('/user/register', { role: 'MERCHANT' });
    } catch (err: any) {
      // 409 / duplicate is fine — user already exists
      if (err?.response?.status !== 409) {
        console.warn('[AuthStore] registerOnBackend:', err?.message);
      }
    }
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
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
        }
      });
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

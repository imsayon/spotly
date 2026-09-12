import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import api from "@/lib/api";

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
  verified?: boolean;
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
  identityError: string | null;
  setUser: (user: SupabaseUser | null) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setIdentityError: (message: string | null) => void;
  registerOnBackend: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchMerchantProfile: () => Promise<MerchantProfile | null>;
  setMerchantProfile: (profile: MerchantProfile) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  merchantProfile: null,
  loading: true,
  identityError: null,

  setUser: async (user) => {
    if (get().user?.id === user?.id && !get().loading && !get().identityError)
      return; // already settled for this user

    if (!user) {
      set({
        user: null,
        merchantProfile: null,
        loading: false,
        identityError: null,
      });
      return;
    }

    set({ user, loading: true, identityError: null });

    try {
      try {
        await api.get("/user/me");
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
        await get().registerOnBackend();
      }
      if (get().user?.id === user.id) await get().fetchMerchantProfile();
    } catch {
      if (get().user?.id === user.id)
        set({ identityError: "We could not load your workspace. Try again." });
    } finally {
      if (get().user?.id === user.id) set({ loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setIdentityError: (identityError) => set({ identityError }),

  registerOnBackend: async () => {
    try {
      await api.post("/user/register", { role: "MERCHANT" });
    } catch (err: any) {
      if (err?.response?.status !== 409) throw err;
    }
  },

  fetchMerchantProfile: async () => {
    try {
      const userId = get().user?.id;
      const response = await api.get("/merchant/me");
      if (get().user?.id !== userId) return null;
      const profile = response.data.data;
      set({ merchantProfile: profile });
      return profile;
    } catch (err: any) {
      if (err?.response?.status === 404 || err.message === "Not Found") {
        set({ merchantProfile: null });
        return null;
      }
      throw err;
    }
  },

  setMerchantProfile: (profile) => set({ merchantProfile: profile }),

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(new URLSearchParams(window.location.search).get("returnTo") || sessionStorage.getItem("spotly-return-to") || "/dashboard")}`
              : undefined,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Merchant Google Sign-In Error:", error);
      throw error;
    }
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUpWithEmail: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(sessionStorage.getItem("spotly-return-to") || "/dashboard")}`
            : undefined,
        data: { full_name: name?.trim() || "" },
      },
    });
    if (error) throw error;
    return !!data.session;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({
      user: null,
      merchantProfile: null,
      loading: false,
      identityError: null,
    });
    if (typeof window !== "undefined") window.location.href = "/";
  },
}));

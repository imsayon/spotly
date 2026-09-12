import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import api from "@/lib/api";
import { User as BackendUser } from "@spotly/types";

interface AuthState {
  user: SupabaseUser | null;
  profile: BackendUser | null;
  loading: boolean;
  identityError: string | null;
  forceOnboarding: boolean;
  setUser: (user: SupabaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setIdentityError: (message: string | null) => void;
  setProfile: (profile: BackendUser | null) => void;
  setForceOnboarding: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<BackendUser | null>;
  updateProfile: (data: Partial<BackendUser>) => Promise<void>;
  registerOnBackend: (role?: "CONSUMER" | "MERCHANT") => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  identityError: null,
  forceOnboarding: false,

  setUser: (user) =>
    set({
      user,
      loading: false,
      identityError: null,
      ...(user ? {} : { profile: null, forceOnboarding: false }),
    }),
  setLoading: (loading) => set({ loading }),
  setIdentityError: (identityError) => set({ identityError }),
  setProfile: (profile) => set({ profile }),
  setForceOnboarding: (val) => set({ forceOnboarding: val }),

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(new URLSearchParams(window.location.search).get("returnTo") || sessionStorage.getItem("spotly-return-to") || "/home")}`
              : undefined,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Email Sign-In Error:", error);
      throw error;
    }
  },

  signUpWithEmail: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(sessionStorage.getItem("spotly-return-to") || "/home")}`
              : undefined,
          data: {
            full_name: name?.trim() || "",
          },
        },
      });
      if (error) throw error;
      return !!data.session;
    } catch (error) {
      console.error("Email Sign-Up Error:", error);
      throw error;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({
      user: null,
      profile: null,
      forceOnboarding: false,
      identityError: null,
    });
    if (typeof window !== "undefined") window.location.href = "/";
  },

  fetchProfile: async () => {
    try {
      const userId = get().user?.id;
      const res = await api.get("/user/me");
      if (get().user?.id !== userId) return null;
      const profile = res.data.data;
      set({ profile });
      if (profile && (!profile.phone || !profile.location)) {
        set({ forceOnboarding: true });
      }
      return profile;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        set({ profile: null });
        return null;
      }
      throw error;
    }
  },

  updateProfile: async (data) => {
    const res = await api.patch("/user/me", data);
    set({ profile: res.data.data, forceOnboarding: false });
  },

  clearProfile: async () => {
    await api.patch("/user/me", { name: "", phone: "", location: "" });
    set({ profile: null, forceOnboarding: true });
  },

  registerOnBackend: async (role = "CONSUMER") => {
    try {
      await api.post("/user/register", { role });
    } catch (error: any) {
      if (error?.response?.status !== 409) throw error;
    }
  },
}));

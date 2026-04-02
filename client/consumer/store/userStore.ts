import { create } from 'zustand';
import type { User } from '../types';
import { usersApi } from '../services/api';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (phone: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearError: () => void;
}

/**
 * User and authentication state management
 * Handles user profile, login/logout, and auth state
 */
export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  login: async (phone: string, name: string) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const user = await usersApi.upsert(phone, name);
      set({
        user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to login. Please try again.';
      setError(errorMsg);
      throw err;
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  updateProfile: async (updates: Partial<User>) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const user = await usersApi.updateProfile(updates);
      set({
        user,
        loading: false,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMsg);
      throw err;
    }
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));

import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Supabase JWT ──────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    let token = null;
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;

    if (!token && typeof window !== 'undefined') {
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (storageKey) {
        const sessionData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        token = sessionData?.access_token;
      }
    }

    if (token) {
      if (!config.headers) config.headers = {} as any;
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* public routes */ }
  return config;
});

// ─── Response Interceptor — Preserve full error for catch blocks ─────────
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response) {
      err.message = err.response.data?.message ?? err.response.statusText ?? 'Request failed';
    }
    return Promise.reject(err);
  },
);

export default api;

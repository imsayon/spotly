import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Supabase JWT ──────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
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

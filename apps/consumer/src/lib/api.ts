import axios from 'axios';
import { getFirebaseAuth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — Attach Firebase JWT ──────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No session — let public routes through
  }
  return config;
});

// ─── Response Interceptor — Preserve full error for catch blocks ─────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      error.message = error.response.data?.message ?? error.response.statusText ?? 'Request failed';
    }
    return Promise.reject(error);
  },
);

export default api;

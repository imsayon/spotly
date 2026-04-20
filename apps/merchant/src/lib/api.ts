import axios from 'axios';
import { getFirebaseAuth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Firebase JWT ──────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* public routes */ }
  return config;
});

// ─── Response Interceptor — Preserve full error for catch blocks ─────────
api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Re-throw original axios error so catch blocks can access err.response.data
    // Attach a clean .message for convenience
    if (err.response) {
      err.message = err.response.data?.message ?? err.response.statusText ?? 'Request failed';
    }
    return Promise.reject(err);
  },
);

export default api;

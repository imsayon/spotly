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

// ─── Response Interceptor — Normalize errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

export default api;

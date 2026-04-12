import axios from 'axios';
import { getFirebaseToken } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getFirebaseToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch { /* public routes */ }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(new Error(err.response?.data?.message ?? err.message ?? 'Error')),
);

export default api;

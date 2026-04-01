import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export const merchantsApi = {
  findNearby: (lat: number, lng: number, category?: string) =>
    api.get('/merchants', { params: { lat, lng, category } }),
};

export const queueApi = {
  join: (merchantId: string, userId: string) =>
    api.post(`/merchants/${merchantId}/queue`, { userId }),
  getStatus: (merchantId: string, entryId: string) =>
    api.get(`/merchants/${merchantId}/queue/${entryId}`),
  redeem: (entryId: string, otp: string) =>
    api.post(`/merchants/queue/${entryId}/arrived`, { otp }),
};

export const usersApi = {
  register: (phone: string, name: string) => api.post('/users', { phone, name }),
};

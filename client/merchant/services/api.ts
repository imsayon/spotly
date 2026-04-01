import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export const queueApi = {
  getStatus: (merchantId: string, entryId: string) =>
    api.get(`/merchants/${merchantId}/queue/${entryId}`),
  advance: (merchantId: string) =>
    api.post(`/merchants/${merchantId}/queue/advance`),
};

export const merchantsApi = {
  register: (body: { name: string; category: string; address: string; lat: number; lng: number }) =>
    api.post('/merchants', body),
};

import axios from "axios";
import { supabase } from "./supabase";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error("Set EXPO_PUBLIC_API_URL before starting the Spotly mobile app.");
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  } catch {
    // Public API calls remain usable; protected endpoints will return 401.
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      error.message =
        error.response.data?.error?.message ??
        error.response.data?.message ??
        error.response.statusText ??
        "Request failed";
    }
    return Promise.reject(error);
  },
);

export default api;

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiError, ApiResponse, Merchant, QueueEntry, User, PaginatedResponse } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Axios instance with default configuration
 * Includes request/response interceptors for error handling
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Add auth token if available
  client.interceptors.request.use(
    (config) => {
      // TODO: Add auth token from secure storage if available
      // const token = await getAuthToken();
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Handle common error cases
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<any>) => {
      const apiError: ApiError = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.response?.data?.code || error.code,
      };
      return Promise.reject(apiError);
    }
  );

  return client;
};

export const api = createApiClient();

/**
 * Merchants API endpoints
 */
export const merchantsApi = {
  /**
   * Find nearby merchants by coordinates and optional category
   */
  findNearby: (lat: number, lng: number, category?: string) =>
    api.get<Merchant[]>('/merchants', { params: { lat, lng, category } }),

  /**
   * Get single merchant details
   */
  getById: (merchantId: string) =>
    api.get<Merchant>(`/merchants/${merchantId}`),

  /**
   * Get queue state for a merchant
   */
  getQueueState: (merchantId: string) =>
    api.get(`/merchants/${merchantId}/queue-state`),
};

/**
 * Queue API endpoints
 */
export const queueApi = {
  /**
   * Join queue at a merchant
   * @param merchantId - The merchant ID
   * @param userId - The user ID
   * @returns Queue entry with token and position
   */
  join: async (merchantId: string, userId: string): Promise<QueueEntry> => {
    try {
      const { data } = await api.post<ApiResponse<QueueEntry>>(
        `/merchants/${merchantId}/queue`,
        { userId }
      );
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to join queue');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current queue status for an entry
   */
  getStatus: async (entryId: string): Promise<QueueEntry> => {
    try {
      const { data } = await api.get<ApiResponse<QueueEntry>>(`/queue/${entryId}`);
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to get queue status');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Leave/cancel queue
   */
  leave: async (entryId: string): Promise<void> => {
    try {
      await api.delete(`/queue/${entryId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Mark as arrived and provide OTP for redemption
   */
  markArrived: async (entryId: string, otp: string): Promise<QueueEntry> => {
    try {
      const { data } = await api.post<ApiResponse<QueueEntry>>(
        `/queue/${entryId}/arrived`,
        { otp }
      );
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to mark as arrived');
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * Users API endpoints
 */
export const usersApi = {
  /**
   * Register or get user by phone
   */
  upsert: async (phone: string, name: string): Promise<User> => {
    try {
      const { data } = await api.post<ApiResponse<User>>('/users', { phone, name });
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to register user');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    try {
      const { data } = await api.get<ApiResponse<User>>('/users/me');
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to get profile');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    try {
      const { data } = await api.patch<ApiResponse<User>>('/users/me', updates);
      if (data.data) return data.data;
      throw new Error(data.error?.message || 'Failed to update profile');
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * Error handler utility
 */
const handleApiError = (error: any): ApiError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ApiError;
  }
  return {
    message: String(error?.message || 'An unexpected error occurred'),
    status: error?.status || 500,
  };
};

export { handleApiError };

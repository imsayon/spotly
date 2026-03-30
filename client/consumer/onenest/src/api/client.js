import axios from 'axios';

// Create a centralized API client
export const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor - Add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Future: Add auth token from store/localStorage
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth and redirect
      console.error('Unauthorized access');
    }
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

export default api;

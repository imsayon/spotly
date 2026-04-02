/**
 * Application constants and configuration
 */

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000',
  TIMEOUT: 15_000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const SOCKET_CONFIG = {
  AUTO_CONNECT: false,
  RECONNECTION: true,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_ATTEMPTS: 10,
  TRANSPORTS: ['websocket', 'polling'],
};

export const QUEUE_CONFIG = {
  NOTIFICATION_THRESHOLD: 5, // Notify when position <= 5
  REFRESH_INTERVAL: 30_000, // 30 seconds
  ETA_THRESHOLD_MINUTES: 15,
  AVG_TIME_PER_CUSTOMER: 2, // minutes
  AUTO_HIDE_NOTIFICATION_DURATION: 8000, // milliseconds
};

export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 500,
  SHORT_TOAST_DURATION: 2000,
  LONG_TOAST_DURATION: 5000,
};

export const VALIDATION_RULES = {
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  OTP_REGEX: /^[0-9]{4,6}$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  INVALID_OTP: 'Invalid OTP. Please check and try again.',
  INVALID_PHONE: 'Invalid phone number format.',
  FAILED_TO_JOIN: 'Failed to join queue. Please try again.',
  FAILED_TO_LEAVE: 'Failed to leave queue. Please try again.',
  FAILED_TO_FETCH_MERCHANTS: 'Failed to load merchants. Using cached data.',
  LOCATION_PERMISSION_DENIED: 'Location permission denied. Using default location.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export const SUCCESS_MESSAGES = {
  JOINED_QUEUE: 'Successfully joined queue!',
  LEFT_QUEUE: 'You have left the queue.',
  MARKED_ARRIVED: 'We have noted your arrival.',
  POSITION_UPDATED: 'Your position has been updated.',
};

export const COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#e0e7ff',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  LIGHT_BG: '#f8fafc',
  BORDER: '#e2e8f0',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
};

export const STATUS_CONFIG = {
  WAITING: {
    icon: '⏳',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  CALLED: {
    icon: '📢',
    color: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  SERVED: {
    icon: '✅',
    color: '#10b981',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  MISSED: {
    icon: '⚠️',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  CANCELLED: {
    icon: '❌',
    color: '#9ca3af',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
};

export const FEATURE_FLAGS = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_LOCATION: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  DEBUG_MODE: process.env.NODE_ENV === 'development',
};

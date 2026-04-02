/**
 * Utility functions for the Spotly consumer app
 */

import type { QueueEntry, QueueStatus } from '../types';

/**
 * Format time to human-readable string
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date to human-readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get status color based on queue status
 */
export const getStatusColor = (status: QueueStatus): string => {
  const colors: Record<QueueStatus, string> = {
    WAITING: '#f59e0b',
    CALLED: '#6366f1',
    SERVED: '#10b981',
    MISSED: '#ef4444',
    CANCELLED: '#9ca3af',
  };
  return colors[status] || '#ccc';
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: QueueStatus): string => {
  const labels: Record<QueueStatus, string> = {
    WAITING: 'Waiting in Queue',
    CALLED: 'Being Served',
    SERVED: 'Service Complete',
    MISSED: 'Missed Turn',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || 'Unknown';
};

/**
 * Calculate time since joining queue
 */
export const getWaitTime = (createdAt: string): number => {
  const now = new Date().getTime();
  const joined = new Date(createdAt).getTime();
  return Math.floor((now - joined) / 1000 / 60); // in minutes
};

/**
 * Determine if notification should be shown
 */
export const shouldShowNotification = (
  position: number | null,
  threshold: number = 5
): boolean => {
  return position !== null && position <= threshold;
};

/**
 * Calculate ETA based on position and avg wait time
 */
export const calculateETA = (
  position: number | null,
  avgTimePerCustomer: number = 2 // minutes
): number | null => {
  if (position === null) return null;
  return Math.max(position * avgTimePerCustomer, 0);
};

/**
 * Validate OTP format
 */
export const isValidOTP = (otp: string): boolean => {
  return /^[0-9]{4,6}$/.test(otp);
};

/**
 * Validate phone number format (simple)
 */
export const isValidPhone = (phone: string): boolean => {
  return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
    phone.replace(/[\s]/g, '')
  );
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Generate mock OTP (for development)
 */
export const generateMockOTP = (): string => {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
};

/**
 * Check if queue entry is active
 */
export const isQueueEntryActive = (entry: QueueEntry): boolean => {
  return entry.status === 'WAITING' || entry.status === 'CALLED';
};

/**
 * Get queue entry status emoji
 */
export const getStatusEmoji = (status: QueueStatus): string => {
  const emojis: Record<QueueStatus, string> = {
    WAITING: '⏳',
    CALLED: '📞',
    SERVED: '✅',
    MISSED: '⚠️',
    CANCELLED: '❌',
  };
  return emojis[status] || '❓';
};

/**
 * Log event for analytics (placeholder)
 */
export const logEvent = (eventName: string, data?: Record<string, any>): void => {
  console.log(`📊 Event: ${eventName}`, data || '');
  // TODO: Connect to analytics service
};

/**
 * Debounce function for API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed after max attempts');
};

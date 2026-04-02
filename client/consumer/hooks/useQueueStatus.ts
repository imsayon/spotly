import { useEffect, useRef, useCallback } from 'react';
import { useQueueStore } from '../store/queueStore';
import type { QueueStatus, QUEUE_THRESHOLDS } from '../types';

export interface QueueStatusInfo {
  isWaiting: boolean;
  isCalled: boolean;
  isServed: boolean;
  isMissed: boolean;
  position: number | null;
  eta: number | null;
  shouldNotify: boolean;
  hasNotified: boolean;
}

/**
 * Hook to track queue status and trigger notifications
 * Provides position tracking and status monitoring
 */
export const useQueueStatus = (notificationThreshold: number = 5): QueueStatusInfo => {
  const { entry, status, position, eta } = useQueueStore();
  const notifiedRef = useRef(false);

  // Reset notification flag when position changes
  useEffect(() => {
    if (position !== null && position > notificationThreshold) {
      notifiedRef.current = false;
    }
  }, [position, notificationThreshold]);

  const shouldNotify = position !== null && position <= notificationThreshold && !notifiedRef.current;

  // Track notification trigger
  useEffect(() => {
    if (shouldNotify) {
      notifiedRef.current = true;
      console.log(`🔔 Notification triggered! Position: ${position}`);
    }
  }, [shouldNotify, position]);

  return {
    isWaiting: status === 'WAITING',
    isCalled: status === 'CALLED',
    isServed: status === 'SERVED',
    isMissed: status === 'MISSED',
    position,
    eta,
    shouldNotify,
    hasNotified: notifiedRef.current,
  };
};

/**
 * Hook for auto-refresh queue status
 * Polls server periodically to ensure data consistency
 */
export const useQueueStatusRefresh = (
  entryId?: string,
  refreshInterval: number = 30_000 // 30 seconds
) => {
  const { getQueueStatus, loading, error } = useQueueStore();

  const refresh = useCallback(async () => {
    if (entryId) {
      try {
        await getQueueStatus(entryId);
      } catch (err) {
        console.error('Failed to refresh queue status:', err);
      }
    }
  }, [entryId, getQueueStatus]);

  useEffect(() => {
    // Initial refresh
    void refresh();

    // Setup interval
    const interval = setInterval(() => {
      void refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return { refresh, loading, error };
};

/**
 * Hook to handle status transitions and side effects
 */
export const useQueueStatusTransition = (
  onCalled?: () => void,
  onServed?: () => void,
  onMissed?: () => void
) => {
  const { status } = useQueueStore();
  const previousStatusRef = useRef<QueueStatus | null>(null);

  useEffect(() => {
    if (status === 'CALLED' && previousStatusRef.current !== 'CALLED') {
      onCalled?.();
    } else if (status === 'SERVED' && previousStatusRef.current !== 'SERVED') {
      onServed?.();
    } else if (status === 'MISSED' && previousStatusRef.current !== 'MISSED') {
      onMissed?.();
    }

    previousStatusRef.current = status;
  }, [status, onCalled, onServed, onMissed]);
};

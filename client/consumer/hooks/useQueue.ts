import { useEffect, useCallback } from 'react';
import { useQueueStore } from '../store/queueStore';
import { useSocket } from './useSocket';

/**
 * Main hook for queue operations
 * Combines API calls and socket events for seamless queue management
 */
export const useQueue = (merchantId: string) => {
  const {
    entry,
    loading,
    error,
    position,
    status,
    eta,
    socketConnected,
    joinQueue,
    getQueueStatus,
    leaveQueue,
    markArrived,
    setError,
    clearError,
  } = useQueueStore();

  const { connected } = useSocket(merchantId);

  // Join queue with error handling
  const join = useCallback(
    async (userId: string) => {
      clearError();
      try {
        return await joinQueue(merchantId, userId);
      } catch (err) {
        console.error('Failed to join queue:', err);
        throw err;
      }
    },
    [merchantId, joinQueue, clearError]
  );

  // Leave queue with confirmation
  const leave = useCallback(async () => {
    if (!entry?.id) return;
    clearError();
    try {
      await leaveQueue(entry.id);
    } catch (err) {
      console.error('Failed to leave queue:', err);
      throw err;
    }
  }, [entry?.id, leaveQueue, clearError]);

  // Mark as arrived and redeem
  const arrive = useCallback(
    async (otp: string) => {
      if (!entry?.id) return;
      clearError();
      try {
        return await markArrived(entry.id, otp);
      } catch (err) {
        console.error('Failed to mark as arrived:', err);
        throw err;
      }
    },
    [entry?.id, markArrived, clearError]
  );

  // Manual status check
  const checkStatus = useCallback(async () => {
    if (!entry?.id) return;
    clearError();
    try {
      return await getQueueStatus(entry.id);
    } catch (err) {
      console.error('Failed to check status:', err);
      throw err;
    }
  }, [entry?.id, getQueueStatus, clearError]);

  // Setup socket connection on component mount
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, [merchantId]);

  return {
    // State
    entry,
    loading,
    error,
    position,
    status,
    eta,
    connected,
    socketConnected,

    // Actions
    join,
    leave,
    arrive,
    checkStatus,
    clearError,

    // Computed
    isJoined: !!entry,
    isWaiting: status === 'WAITING',
    isCalled: status === 'CALLED',
    isServed: status === 'SERVED',
    isMissed: status === 'MISSED',
  };
};

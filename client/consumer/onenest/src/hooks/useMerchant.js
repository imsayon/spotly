import { useEffect, useCallback } from 'react';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import { getSocket } from '../utils/socket.js';

// Hook to create a queue
export const useCreateQueue = () => {
  const { setLoading, setError } = useStore();

  const createQueue = useCallback(
    async (queueName, merchantId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/merchant/queue', {
          name: queueName,
          merchantId,
        });
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to create queue');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  return { createQueue };
};

// Hook to get merchant's queues
export const useGetMerchantQueues = () => {
  const { setQueueList, setLoading, setError } = useStore();

  const getQueues = useCallback(
    async (merchantId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/merchant/queues/${merchantId}`);
        setQueueList(response.data);
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch queues');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setQueueList, setLoading, setError]
  );

  return { getQueues };
};

// Hook to advance queue (call next user)
export const useAdvanceQueue = () => {
  const { setActiveToken, setLoading, setError } = useStore();

  const advanceQueue = useCallback(
    async (queueId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/merchant/queue/${queueId}/advance`);
        setActiveToken(response.data.nextToken);
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to advance queue');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setActiveToken, setLoading, setError]
  );

  return { advanceQueue };
};

// Hook to remove user from queue
export const useRemoveUser = () => {
  const { setLoading, setError } = useStore();

  const removeUser = useCallback(
    async (queueId, userId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(
          `/merchant/queue/${queueId}/remove/${userId}`
        );
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to remove user');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  return { removeUser };
};

// Hook to reset queue
export const useResetQueue = () => {
  const { setActiveToken, setQueueList, setLoading, setError } = useStore();

  const resetQueue = useCallback(
    async (queueId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(`/merchant/queue/${queueId}/reset`);
        setActiveToken(null);
        // Refresh queue list
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to reset queue');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setActiveToken, setQueueList, setLoading, setError]
  );

  return { resetQueue };
};

// Hook to listen to merchant-specific real-time updates
export const useMerchantUpdates = (merchantId) => {
  const { setMerchantStats, setQueueList } = useStore();

  useEffect(() => {
    const socket = getSocket();

    // Real-time merchant events
    socket.on(`merchant-${merchantId}-user-joined`, (data) => {
      console.log('User joined:', data);
      // Update queue list
    });

    socket.on(`merchant-${merchantId}-user-left`, (data) => {
      console.log('User left:', data);
      // Update queue list
    });

    socket.on(`merchant-${merchantId}-queue-advanced`, (data) => {
      console.log('Queue advanced:', data);
      // Update active token and queue stats
    });

    socket.on(`merchant-${merchantId}-stats-updated`, (data) => {
      setMerchantStats(data);
    });

    return () => {
      socket.off(`merchant-${merchantId}-user-joined`);
      socket.off(`merchant-${merchantId}-user-left`);
      socket.off(`merchant-${merchantId}-queue-advanced`);
      socket.off(`merchant-${merchantId}-stats-updated`);
    };
  }, [merchantId, setMerchantStats, setQueueList]);
};

export default {
  useCreateQueue,
  useGetMerchantQueues,
  useAdvanceQueue,
  useRemoveUser,
  useResetQueue,
  useMerchantUpdates,
};

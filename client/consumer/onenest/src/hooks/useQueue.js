import { useEffect, useCallback } from 'react';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import { getSocket } from '../utils/socket.js';

// Hook to join a queue
export const useJoinQueue = () => {
  const { setCurrentQueue, setPosition, setStatus, setLoading, setError } =
    useStore();

  const joinQueue = useCallback(
    async (queueId, userName) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/queue/join', {
          queueId,
          userName,
        });

        // Subscribe to socket updates after joining
        const socket = getSocket();
        socket.on(`queue-${queueId}-updated`, (data) => {
          setCurrentQueue(data.queue);
          setPosition(data.userPosition);
        });

        setCurrentQueue(response.data.queue);
        setPosition(response.data.position);
        setStatus('waiting');
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to join queue');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentQueue, setPosition, setStatus, setLoading, setError]
  );

  return { joinQueue };
};

// Hook to leave a queue
export const useLeaveQueue = () => {
  const { currentQueue, setCurrentQueue, setPosition, setStatus, setLoading, setError } =
    useStore();

  const leaveQueue = useCallback(
    async (userId) => {
      setLoading(true);
      setError(null);
      try {
        await api.post('/queue/leave', {
          queueId: currentQueue?.id,
          userId,
        });

        const socket = getSocket();
        socket.off(`queue-${currentQueue?.id}-updated`);

        setCurrentQueue(null);
        setPosition(null);
        setStatus(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to leave queue');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentQueue, setCurrentQueue, setPosition, setStatus, setLoading, setError]
  );

  return { leaveQueue };
};

// Hook to get queue status
export const useQueueStatus = () => {
  const { currentQueue, setPosition, setLoading, setError } = useStore();

  const getQueueStatus = useCallback(
    async (queueId) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/queue/${queueId}/status`);
        setPosition(response.data.userPosition);
        return response.data;
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch queue status');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setPosition, setLoading, setError]
  );

  return { getQueueStatus };
};

// Hook to listen for real-time updates via Socket
export const useQueueUpdates = () => {
  const { setQueueUpdated, setPositionChanged, setQueueAdvanced } = useStore();

  useEffect(() => {
    const socket = getSocket();

    // Real-time event listeners
    socket.on('queue_updated', (data) => {
      setQueueUpdated(new Date().getTime());
    });

    socket.on('position_changed', (data) => {
      setPositionChanged(data.newPosition);
    });

    socket.on('queue_advanced', (data) => {
      setQueueAdvanced(data);
    });

    return () => {
      socket.off('queue_updated');
      socket.off('position_changed');
      socket.off('queue_advanced');
    };
  }, [setQueueUpdated, setPositionChanged, setQueueAdvanced]);
};

export default {
  useJoinQueue,
  useLeaveQueue,
  useQueueStatus,
  useQueueUpdates,
};

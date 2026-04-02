import { useEffect } from 'react';
import {
  connectSocket,
  disconnectSocket,
  joinMerchantRoom,
  leaveMerchantRoom,
  onQueueUpdated,
  onPositionChanged,
  onQueueCalled,
  onQueueAdvanced,
  isSocketConnected,
} from '../services/socket';
import { useQueueStore } from '../store/queueStore';

/**
 * Custom hook to manage socket connection and events
 * Handles connection, room management, and event listeners
 */
export const useSocket = (merchantId?: string) => {
  const { setSocketConnected, updatePosition, setStatus } = useQueueStore();

  useEffect(() => {
    // Connect on mount
    connectSocket();

    // Join room if merchantId provided
    if (merchantId) {
      joinMerchantRoom(merchantId);
    }

    return () => {
      // Leave room on unmount
      if (merchantId) {
        leaveMerchantRoom(merchantId);
      }
    };
  }, [merchantId]);

  useEffect(() => {
    // Listen for connection status
    const checkConnection = setInterval(() => {
      const connected = isSocketConnected();
      setSocketConnected(connected);
    }, 1000);

    return () => clearInterval(checkConnection);
  }, [setSocketConnected]);

  useEffect(() => {
    // Setup event listeners
    const unsubscribeUpdated = onQueueUpdated((data) => {
      if (data.position !== undefined) {
        updatePosition(data.position, data.eta);
      }
      if (data.status) {
        setStatus(data.status);
      }
    });

    const unsubscribePosition = onPositionChanged((data) => {
      updatePosition(data.position, data.eta);
    });

    const unsubscribeCalled = onQueueCalled((data) => {
      setStatus('CALLED');
      console.log('📢 Queue called! Token:', data.tokenNumber);
    });

    const unsubscribeAdvanced = onQueueAdvanced((data) => {
      console.log('➡️ Queue advanced. Now serving:', data.currentToken);
    });

    return () => {
      unsubscribeUpdated();
      unsubscribePosition();
      unsubscribeCalled();
      unsubscribeAdvanced();
    };
  }, [updatePosition, setStatus]);

  return {
    connected: isSocketConnected(),
  };
};

/**
 * Hook to manage socket lifecycle on component mount/unmount
 */
export const useSocketConnection = () => {
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    connected: isSocketConnected(),
  };
};

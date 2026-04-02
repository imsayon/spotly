import { io, Socket } from 'socket.io-client';
import type { QueueUpdatedEvent, QUEUE_THRESHOLDS } from '../types';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';

interface SocketConfig {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
  transports?: string[];
}

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Initialize or get existing socket instance
 * Uses lazy initialization pattern
 */
const getSocket = (): Socket => {
  if (!socket) {
    const config: SocketConfig = {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling'],
    };

    socket = io(`${WS_URL}/queue`, config);

    // Handle connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
      reconnectAttempts = 0;
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.log('[Socket] Connection error:', error.message);
      reconnectAttempts++;
    });

    socket.on('reconnect_attempt', () => {
      console.log('[Socket] Reconnection attempt:', reconnectAttempts + 1);
    });

    socket.on('error', (error: any) => {
      console.error('[Socket] Error:', error);
    });
  }

  return socket;
};

/**
 * Connect to socket server
 */
export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

/**
 * Disconnect from socket server
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

/**
 * Join a merchant room to receive real-time queue updates
 */
export const joinMerchantRoom = (merchantId: string): void => {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('joinRoom', merchantId);
  console.log('[Socket] Joined room:', merchantId);
};

/**
 * Leave a merchant room
 */
export const leaveMerchantRoom = (merchantId: string): void => {
  const s = getSocket();
  s.emit('leaveRoom', merchantId);
  console.log('[Socket] Left room:', merchantId);
};

/**
 * Listen for queue updates and receive real-time position/status changes
 */
export const onQueueUpdated = (
  cb: (data: QueueUpdatedEvent) => void
): (() => void) => {
  const s = getSocket();
  s.on('queue_updated', cb);
  console.log('[Socket] Listening for queue_updated');
  
  // Return cleanup function
  return () => {
    s.off('queue_updated', cb);
    console.log('[Socket] Stopped listening for queue_updated');
  };
};

/**
 * Listen for position changes
 */
export const onPositionChanged = (
  cb: (data: { position: number; eta?: number }) => void
): (() => void) => {
  const s = getSocket();
  s.on('position_changed', cb);
  console.log('[Socket] Listening for position_changed');
  
  return () => {
    s.off('position_changed', cb);
    console.log('[Socket] Stopped listening for position_changed');
  };
};

/**
 * Listen for when user is called to service
 */
export const onQueueCalled = (
  cb: (data: { tokenNumber: number; otp?: string }) => void
): (() => void) => {
  const s = getSocket();
  s.on('queue_called', cb);
  console.log('[Socket] Listening for queue_called');
  
  return () => {
    s.off('queue_called', cb);
    console.log('[Socket] Stopped listening for queue_called');
  };
};

/**
 * Listen for queue advancement (when next customer is being served)
 */
export const onQueueAdvanced = (
  cb: (data: { currentToken: number; nextToken?: number }) => void
): (() => void) => {
  const s = getSocket();
  s.on('queue_advanced', cb);
  console.log('[Socket] Listening for queue_advanced');
  
  return () => {
    s.off('queue_advanced', cb);
    console.log('[Socket] Stopped listening for queue_advanced');
  };
};

/**
 * Get socket instance (for advanced use cases)
 */
export const getSocketInstance = (): Socket => {
  return getSocket();
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

export default {
  connectSocket,
  disconnectSocket,
  joinMerchantRoom,
  leaveMerchantRoom,
  onQueueUpdated,
  onPositionChanged,
  onQueueCalled,
  onQueueAdvanced,
  getSocketInstance,
  isSocketConnected,
};

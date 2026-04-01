import { io, Socket } from 'socket.io-client';
import type { QueueUpdatedEvent } from '../types';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';
let socket: Socket | null = null;

const getSocket = (): Socket => {
  if (!socket) {
    socket = io(`${WS_URL}/queue`, { transports: ['websocket'], autoConnect: false });
  }
  return socket;
};

export const joinMerchantRoom = (merchantId: string) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('joinRoom', merchantId);
};

export const onQueueUpdated = (cb: (data: QueueUpdatedEvent) => void) => {
  const s = getSocket();
  s.on('queue_updated', cb);
  return () => { s.off('queue_updated', cb); };
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

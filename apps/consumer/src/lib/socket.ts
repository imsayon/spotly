import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO connection.
 * Call this once; the same socket is reused across the app.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinOutletRoom(outletId: string) {
  getSocket().emit('join_outlet', { outletId });
}

export function leaveOutletRoom(outletId: string) {
  getSocket().emit('leave_outlet', { outletId });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

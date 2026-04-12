import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

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

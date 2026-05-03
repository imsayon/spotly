import { io, Socket } from 'socket.io-client';

import { supabase } from './supabase';

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO connection.
 * Call this once; the same socket is reused across the app.
 */
export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (socket) socket.disconnect();

  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export async function joinOutletRoom(outletId: string) {
  const s = await getSocket();
  s.emit('join_outlet', { outletId });
}

export async function leaveOutletRoom(outletId: string) {
  const s = await getSocket();
  s.emit('leave_outlet', { outletId });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

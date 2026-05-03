import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (socket) { socket.disconnect(); socket = null; }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('disconnect', () => {
    // Don't null out — reconnection is automatic
  });

  return socket;
}

export async function joinOutletRoom(outletId: string): Promise<void> {
  const s = await getSocket();
  s.emit('join_outlet', { outletId });
}

export async function leaveOutletRoom(outletId: string): Promise<void> {
  const s = await getSocket();
  s.emit('leave_outlet', { outletId });
}

export async function disconnectSocket(): Promise<void> {
  socket?.disconnect();
  socket = null;
}

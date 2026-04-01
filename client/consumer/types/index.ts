export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  phone: string;
  pushToken?: string;
}

export interface QueueState {
  merchantId: string;
  currentToken: number;
  nextToken: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  queueState?: QueueState | null;
}

export interface QueueEntry {
  id: string;
  merchantId: string;
  userId: string;
  tokenNumber: number;
  status: QueueStatus;
  createdAt: string;
  position: number | null;
  otp?: string;
}

export interface QueueUpdatedEvent {
  tokenNumber?: number;
  currentToken?: number;
  position?: number;
  event: 'joined' | 'called' | 'served' | 'missed';
}

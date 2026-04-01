export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED';

export interface QueueEntry {
  id: string;
  merchantId: string;
  userId: string;
  tokenNumber: number;
  status: QueueStatus;
  createdAt: string;
  position: number | null;
}

export interface QueueState {
  merchantId: string;
  currentToken: number;
  nextToken: number;
}

export interface QueueUpdatedEvent {
  currentToken?: number;
  tokenNumber?: number;
  position?: number;
  event: 'joined' | 'called' | 'served' | 'missed';
}

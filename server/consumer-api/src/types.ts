/**
 * Core types and interfaces for the consumer API
 */

export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED';

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  phone?: string;
  rating?: number;
}

export interface QueueState {
  merchantId: string;
  currentToken: number;
  nextToken: number;
  totalWaiting: number;
  avgWaitTime: number;
}

export interface QueueEntry {
  id: string;
  merchantId: string;
  userId: string;
  tokenNumber: number;
  status: QueueStatus;
  position: number | null;
  createdAt: Date;
  calledAt?: Date;
  servedAt?: Date;
  missedAt?: Date;
  eta?: number; // in minutes
  otp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface SocketEventPayload {
  tokenNumber?: number;
  currentToken?: number;
  position?: number;
  eta?: number;
  status?: QueueStatus;
  event: string;
  merchantId?: string;
  userId?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
}

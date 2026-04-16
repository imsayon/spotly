// Queue Status

export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED';

// User Role

export type UserRole = 'CONSUMER' | 'MERCHANT';

// Domain Interfaces

export interface User {
  id: string;              //firebase uid
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  ownerId: string;        //owner firebase uid
  name: string;
  category: string;
  description?: string;
  phone?: string;
  contactEmail?: string;
  logoUrl?: string;
  location?: string;
  rating?: number;
  estimatedWaitTime?: string;
  createdAt: string;
}

export interface Outlet {
  id: string;
  merchantId: string;
  name: string;
  address?: string;
  phone?: string;
  operatingHours?: string;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  userId: string;
  outletId: string;
  tokenNumber: number;
  status: QueueStatus;
  joinedAt: string;
  calledAt?: string;
  servedAt?: string;
}

export interface QueueState {
  outletId: string;
  currentToken: number;
  totalWaiting: number;
}

// API Response Wrappers

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}

// Websocket Events

export interface QueueUpdatePayload {
  outletId: string;
  entries: QueueEntry[];
  currentToken: number;
}

export interface TokenCalledPayload {
  outletId: string;
  tokenNumber: number;
  userId: string;
}

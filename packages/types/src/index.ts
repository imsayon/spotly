// ─── Queue Status ────────────────────────────────────────────────────────────

export type QueueStatus = 'PENDING_ACCEPTANCE' | 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED';

// ─── User Role ────────────────────────────────────────────────────────────────

export type UserRole = 'CONSUMER' | 'MERCHANT';

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface User {
  id: string;       // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;   // owner Firebase UID
  name: string;
  category: string;
  description?: string;
  phone?: string;
  contactEmail?: string;
  logoUrl?: string;
  location?: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  estimatedWaitTime?: string;
  outlets?: Outlet[];
  createdAt: string;
}

export interface Outlet {
  id: string;
  merchantId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
  openTime?: string;
  closeTime?: string;
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
  joinedAt: string;  // ISO string
  calledAt?: string;
  servedAt?: string;
}

export interface QueueState {
  outletId: string;
  currentToken: number;   // currently being served
  totalWaiting: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

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

// ─── WebSocket Events ─────────────────────────────────────────────────────────

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

// ─── Review & Favorite ────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  outletId: string;
  rating: number;
  comment?: string | null;
  createdAt: Date | string;
}

export interface Favorite {
  id: string;
  userId: string;
  outletId: string;
  createdAt: Date | string;
}

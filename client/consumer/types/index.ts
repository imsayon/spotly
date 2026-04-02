export type QueueStatus = 'WAITING' | 'CALLED' | 'SERVED' | 'MISSED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  phone: string;
  pushToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueState {
  merchantId: string;
  currentToken: number;
  nextToken: number;
  totalWaiting: number;
  avgWaitTime?: number;
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
  isOpen?: boolean;
  phone?: string;
  rating?: number;
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
  eta?: number; // in minutes
  calledAt?: string;
  servedAt?: string;
  missedAt?: string;
}

export interface QueueUpdatedEvent {
  tokenNumber?: number;
  currentToken?: number;
  position?: number;
  eta?: number;
  status?: QueueStatus;
  event: 'joined' | 'called' | 'served' | 'missed' | 'advanced' | 'position_updated';
  merchantId?: string;
}

export interface ApiError {
  status?: number;
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const QUEUE_STATUS_COLORS: Record<QueueStatus, string> = {
  WAITING: '#f59e0b',
  CALLED: '#6366f1',
  SERVED: '#10b981',
  MISSED: '#ef4444',
  CANCELLED: '#9ca3af',
};

export const QUEUE_THRESHOLDS = {
  NOTIFICATION_THRESHOLD: 5, // Notify when position <= 5
  ETA_THRESHOLD_MINUTES: 15,
  SOCKET_RECONNECT_DELAY: 5000, // 5 seconds
  SOCKET_RECONNECT_MAX_ATTEMPTS: 10,
};

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'merchant-1',
    name: 'The Coffee Hub',
    category: 'Coffee Shop',
    address: '123 Main St, Downtown',
    lat: 40.7128,
    lng: -74.006,
    distanceKm: 0.5,
    isOpen: true,
    rating: 4.5,
    queueState: {
      merchantId: 'merchant-1',
      currentToken: 42,
      nextToken: 48,
      totalWaiting: 6,
      avgWaitTime: 8,
    },
  },
  {
    id: 'merchant-2',
    name: "Mike's Restaurant",
    category: 'Restaurant',
    address: '456 Oak Ave, Midtown',
    lat: 40.758,
    lng: -73.9855,
    distanceKm: 1.2,
    isOpen: true,
    rating: 4.8,
    queueState: {
      merchantId: 'merchant-2',
      currentToken: 15,
      nextToken: 20,
      totalWaiting: 5,
      avgWaitTime: 12,
    },
  },
  {
    id: 'merchant-3',
    name: 'Fashion Boutique',
    category: 'Retail',
    address: '789 Elm St, Shopping District',
    lat: 40.7505,
    lng: -73.9972,
    distanceKm: 2.1,
    isOpen: true,
    rating: 4.2,
    queueState: {
      merchantId: 'merchant-3',
      currentToken: 8,
      nextToken: 12,
      totalWaiting: 4,
      avgWaitTime: 10,
    },
  },
];

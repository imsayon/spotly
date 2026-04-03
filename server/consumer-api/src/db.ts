/**
 * In-memory database for MVP
 * Stores merchants, queue entries, and queue states
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Merchant,
  QueueEntry,
  QueueState,
  QueueStatus,
  User,
} from './types';

/**
 * Mock merchants data
 */
export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'merchant-1',
    name: 'The Coffee Hub',
    category: 'Coffee Shop',
    address: '123 Main St, Downtown',
    lat: 40.7128,
    lng: -74.006,
    isOpen: true,
    rating: 4.5,
  },
  {
    id: 'merchant-2',
    name: "Mike's Restaurant",
    category: 'Restaurant',
    address: '456 Oak Ave, Midtown',
    lat: 40.758,
    lng: -73.9855,
    isOpen: true,
    rating: 4.8,
  },
  {
    id: 'merchant-3',
    name: 'Fashion Boutique',
    category: 'Retail',
    address: '789 Elm St, Shopping District',
    lat: 40.7505,
    lng: -73.9972,
    isOpen: true,
    rating: 4.2,
  },
];

/**
 * In-memory data store
 */
class Database {
  private merchants: Map<string, Merchant> = new Map();
  private queueEntries: Map<string, QueueEntry> = new Map();
  private queueStates: Map<string, QueueState> = new Map();
  private users: Map<string, User> = new Map();
  private tokenCounters: Map<string, number> = new Map();
  private missedTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeMerchants();
    this.initializeQueueStates();
  }

  /**
   * Initialize merchants
   */
  private initializeMerchants(): void {
    MOCK_MERCHANTS.forEach((merchant) => {
      this.merchants.set(merchant.id, { ...merchant });
    });
    console.log(`[DB] Initialized ${this.merchants.size} merchants`);
  }

  /**
   * Initialize queue states for each merchant
   */
  private initializeQueueStates(): void {
    this.merchants.forEach((merchant) => {
      this.queueStates.set(merchant.id, {
        merchantId: merchant.id,
        currentToken: 0,
        nextToken: 1,
        totalWaiting: 0,
        avgWaitTime: 2, // minutes
      });
      this.tokenCounters.set(merchant.id, 0);
    });
  }

  /**
   * Get all merchants
   */
  getMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  /**
   * Get single merchant
   */
  getMerchant(merchantId: string): Merchant | undefined {
    return this.merchants.get(merchantId);
  }

  /**
   * Get queue state
   */
  getQueueState(merchantId: string): QueueState | undefined {
    return this.queueStates.get(merchantId);
  }

  /**
   * Create or get user
   */
  upsertUser(userId: string, name: string, phone: string): User {
    if (this.users.has(userId)) {
      return this.users.get(userId)!;
    }

    const user: User = {
      id: userId,
      name,
      phone,
      createdAt: new Date(),
    };

    this.users.set(userId, user);
    return user;
  }

  /**
   * Join queue - create new entry with token
   */
  joinQueue(merchantId: string, userId: string): QueueEntry {
    const merchant = this.getMerchant(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const queueState = this.getQueueState(merchantId)!;
    queueState.nextToken += 1;
    queueState.totalWaiting += 1;

    const tokenNumber = queueState.nextToken - 1;
    const position = queueState.totalWaiting - 1;

    const entry: QueueEntry = {
      id: uuidv4(),
      merchantId,
      userId,
      tokenNumber,
      status: 'WAITING',
      position,
      createdAt: new Date(),
      eta: position * queueState.avgWaitTime,
    };

    this.queueEntries.set(entry.id, entry);
    console.log(
      `[Queue] User ${userId} joined merchant ${merchantId} with token #${tokenNumber}`
    );

    return entry;
  }

  /**
   * Get queue entry
   */
  getQueueEntry(entryId: string): QueueEntry | undefined {
    return this.queueEntries.get(entryId);
  }

  /**
   * Get entries for merchant
   */
  getMerchantQueueEntries(merchantId: string): QueueEntry[] {
    return Array.from(this.queueEntries.values()).filter(
      (entry) => entry.merchantId === merchantId && entry.status === 'WAITING'
    );
  }

  /**
   * Update queue entry status
   */
  updateQueueEntryStatus(entryId: string, status: QueueStatus): QueueEntry {
    const entry = this.getQueueEntry(entryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    entry.status = status;

    if (status === 'CALLED') {
      entry.calledAt = new Date();
    } else if (status === 'SERVED') {
      entry.servedAt = new Date();
    } else if (status === 'MISSED') {
      entry.missedAt = new Date();
    }

    return entry;
  }

  /**
   * Advance queue - move to next customer
   */
  advanceQueue(merchantId: string): void {
    const queueState = this.getQueueState(merchantId);
    if (!queueState) return;

    queueState.currentToken += 1;
    queueState.totalWaiting = Math.max(0, queueState.totalWaiting - 1);

    // Update positions for all waiting entries
    const entries = this.getMerchantQueueEntries(merchantId);
    entries.forEach((entry, index) => {
      entry.position = index;
      entry.eta = Math.max(0, index * queueState.avgWaitTime);
    });

    console.log(
      `[Queue] Advanced at ${merchantId}. Current token: #${queueState.currentToken}`
    );
  }

  /**
   * Call next customer
   */
  callNextCustomer(merchantId: string): QueueEntry | null {
    const entries = this.getMerchantQueueEntries(merchantId);
    if (entries.length === 0) return null;

    const nextEntry = entries[0];
    this.updateQueueEntryStatus(nextEntry.id, 'CALLED');

    // Set timeout to mark as missed after 30 seconds
    this.setMissedTimeout(nextEntry.id, merchantId);

    console.log(`[Queue] Called entry ${nextEntry.id} at ${merchantId}`);
    return nextEntry;
  }

  /**
   * Mark entry as served
   */
  markAsServed(entryId: string): QueueEntry {
    const entry = this.getQueueEntry(entryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    this.updateQueueEntryStatus(entryId, 'SERVED');

    // Clear missed timeout if set
    if (this.missedTimeouts.has(entryId)) {
      clearTimeout(this.missedTimeouts.get(entryId));
      this.missedTimeouts.delete(entryId);
    }

    this.advanceQueue(entry.merchantId);
    console.log(`[Queue] Marked ${entryId} as served`);
    return entry;
  }

  /**
   * Set timeout to mark as missed after 30 seconds
   */
  private setMissedTimeout(entryId: string, merchantId: string): void {
    const timeout = setTimeout(() => {
      const entry = this.getQueueEntry(entryId);
      if (entry && entry.status === 'CALLED') {
        this.updateQueueEntryStatus(entryId, 'MISSED');
        this.advanceQueue(merchantId);
        console.log(
          `[Queue] Marked ${entryId} as missed (timeout after 30s)`
        );
      }
      this.missedTimeouts.delete(entryId);
    }, 30_000); // 30 seconds

    this.missedTimeouts.set(entryId, timeout);
  }

  /**
   * Leave queue
   */
  leaveQueue(entryId: string): void {
    const entry = this.getQueueEntry(entryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    this.updateQueueEntryStatus(entryId, 'CANCELLED');

    // Clear timeout if set
    if (this.missedTimeouts.has(entryId)) {
      clearTimeout(this.missedTimeouts.get(entryId));
      this.missedTimeouts.delete(entryId);
    }

    const queueState = this.getQueueState(entry.merchantId);
    if (queueState && entry.status === 'WAITING') {
      queueState.totalWaiting = Math.max(0, queueState.totalWaiting - 1);
    }

    console.log(`[Queue] User left ${entryId}`);
  }

  /**
   * Get all queue entries for a user
   */
  getUserQueueEntries(userId: string): QueueEntry[] {
    return Array.from(this.queueEntries.values()).filter(
      (entry) => entry.userId === userId && entry.status !== 'CANCELLED'
    );
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.queueEntries.clear();
    this.users.clear();
    this.initializeQueueStates();
    Array.from(this.missedTimeouts.values()).forEach((timeout) =>
      clearTimeout(timeout)
    );
    this.missedTimeouts.clear();
    console.log('[DB] Database cleared');
  }
}

/**
 * Singleton instance
 */
export const db = new Database();

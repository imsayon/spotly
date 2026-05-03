import { QueueEntry } from '@spotly/types';

/**
 * QueueRepository — abstract interface.
 *
 * This is the ONLY contract the QueueService depends on.
 * Swap implementations (Firestore → Prisma) by changing the provider
 * in queue.module.ts — zero service rewrites needed.
 */
export interface QueueRepository {
  /** Add a new entry to the queue with atomic token number generation */
  joinQueue(data: Omit<QueueEntry, 'id' | 'tokenNumber'>): Promise<QueueEntry>;

  /** Check whether an outlet can currently accept queue entries */
  isOutletOpen(outletId: string): Promise<boolean>;

  /** Find an active queue entry for this user, if one exists */
  findActiveEntryForUser(userId: string): Promise<QueueEntry | null>;

  /** Get all entries for an outlet (ordered by tokenNumber) */
  getQueue(outletId: string): Promise<QueueEntry[]>;

  /** Get a single entry by ID */
  getEntry(entryId: string): Promise<QueueEntry | null>;

  /** Mark the next WAITING entry as CALLED */
  advanceQueue(outletId: string): Promise<QueueEntry | null>;

  /** Mark an entry as MISSED */
  markMissed(entryId: string): Promise<void>;

  /** Mark an entry as SERVED */
  markServed(entryId: string): Promise<void>;

  /** Remove an entry (consumer leaves queue) */
  leaveQueue(entryId: string): Promise<void>;

  /** Count WAITING entries for an outlet */
  countWaiting(outletId: string): Promise<number>;

  /** Accept a PENDING_ACCEPTANCE entry, moving it to WAITING */
  acceptEntry(entryId: string): Promise<void>;

  /** Get past entries (SERVED + CANCELLED) for a user */
  getHistory(userId: string, limit?: number): Promise<QueueEntry[]>;
}

export const QUEUE_REPOSITORY = 'QUEUE_REPOSITORY';

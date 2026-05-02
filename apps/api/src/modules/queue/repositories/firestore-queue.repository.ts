import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../../firebase/firebase.service';
import { QueueRepository } from '../interfaces/queue-repository.interface';
import { QueueEntry, QueueStatus } from '@spotly/types';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class FirestoreQueueRepository implements QueueRepository {
  private readonly collection = 'queue_entries';
  private static readonly memoryStore = new Map<string, QueueEntry>();

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  private isFirestoreFallbackError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return (
      message.includes('UNAUTHENTICATED') ||
      message.includes('invalid authentication credentials') ||
      message.includes('FAILED_PRECONDITION') ||
      message.toLowerCase().includes('requires an index')
    );
  }

  async joinQueue(data: Omit<QueueEntry, 'id'>): Promise<QueueEntry> {
    const entry: QueueEntry = { id: randomUUID(), ...data };
    try {
      const ref = this.db.collection(this.collection).doc(entry.id);
      await ref.set(entry);
      return entry;
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      FirestoreQueueRepository.memoryStore.set(entry.id, entry);
      return entry;
    }
  }

  async isOutletOpen(): Promise<boolean> {
    return true;
  }

  async findActiveEntryForUser(userId: string): Promise<QueueEntry | null> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('userId', '==', userId)
        .where('status', 'in', ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'])
        .limit(1)
        .get();

      return snapshot.empty ? null : (snapshot.docs[0].data() as QueueEntry);
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      return Array.from(FirestoreQueueRepository.memoryStore.values())
        .find((e) => e.userId === userId && ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'].includes(e.status)) ?? null;
    }
  }

  async getNextTokenNumber(outletId: string): Promise<number> {
    const entries = await this.getQueue(outletId);
    const maxToken = entries.reduce((max, entry) => Math.max(max, entry.tokenNumber), 0);
    return maxToken + 1;
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('outletId', '==', outletId)
        .where('status', 'in', ['WAITING', 'CALLED'])
        .orderBy('tokenNumber', 'asc')
        .get();

      return snapshot.docs.map((d) => d.data() as QueueEntry);
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      return Array.from(FirestoreQueueRepository.memoryStore.values())
        .filter((e) => e.outletId === outletId && (e.status === 'WAITING' || e.status === 'CALLED'))
        .sort((a, b) => a.tokenNumber - b.tokenNumber);
    }
  }

  async getEntry(entryId: string): Promise<QueueEntry | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(entryId).get();
      return doc.exists ? (doc.data() as QueueEntry) : null;
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      return FirestoreQueueRepository.memoryStore.get(entryId) ?? null;
    }
  }

  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('outletId', '==', outletId)
        .where('status', '==', 'WAITING')
        .orderBy('tokenNumber', 'asc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const calledAt = new Date().toISOString();

      await doc.ref.update({ status: 'CALLED' as QueueStatus, calledAt });
      return { ...doc.data(), status: 'CALLED', calledAt } as QueueEntry;
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      const next = Array.from(FirestoreQueueRepository.memoryStore.values())
        .filter((e) => e.outletId === outletId && e.status === 'WAITING')
        .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];
      if (!next) return null;
      const calledAt = new Date().toISOString();
      const updated: QueueEntry = { ...next, status: 'CALLED', calledAt };
      FirestoreQueueRepository.memoryStore.set(updated.id, updated);
      return updated;
    }
  }

  async markMissed(entryId: string): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(entryId)
        .update({ status: 'MISSED' as QueueStatus });
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      const existing = FirestoreQueueRepository.memoryStore.get(entryId);
      if (existing) {
        FirestoreQueueRepository.memoryStore.set(entryId, { ...existing, status: 'MISSED' });
      }
    }
  }

  async markServed(entryId: string): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(entryId)
        .update({ status: 'SERVED' as QueueStatus, servedAt: new Date().toISOString() });
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      const existing = FirestoreQueueRepository.memoryStore.get(entryId);
      if (existing) {
        FirestoreQueueRepository.memoryStore.set(entryId, {
          ...existing,
          status: 'SERVED',
          servedAt: new Date().toISOString(),
        });
      }
    }
  }

  async leaveQueue(entryId: string): Promise<void> {
    try {
      await this.db.collection(this.collection).doc(entryId).delete();
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      FirestoreQueueRepository.memoryStore.delete(entryId);
    }
  }

  async acceptEntry(entryId: string): Promise<void> {
    try {
      await this.db
        .collection(this.collection)
        .doc(entryId)
        .update({ status: 'WAITING' as QueueStatus });
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      const existing = FirestoreQueueRepository.memoryStore.get(entryId);
      if (existing) {
        FirestoreQueueRepository.memoryStore.set(entryId, { ...existing, status: 'WAITING' });
      }
    }
  }

  async countWaiting(outletId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('outletId', '==', outletId)
        .where('status', '==', 'WAITING')
        .get();

      return snapshot.size;
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      return Array.from(FirestoreQueueRepository.memoryStore.values())
        .filter((e) => e.outletId === outletId && e.status === 'WAITING').length;
    }
  }

  async getHistory(userId: string, limit = 20): Promise<QueueEntry[]> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('userId', '==', userId)
        .where('status', 'in', ['SERVED', 'CANCELLED', 'MISSED'])
        .orderBy('joinedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((d) => d.data() as QueueEntry);
    } catch (err) {
      if (!this.isFirestoreFallbackError(err)) throw err;
      return Array.from(FirestoreQueueRepository.memoryStore.values())
        .filter((e) => e.userId === userId && ['SERVED', 'CANCELLED', 'MISSED'].includes(e.status))
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, limit);
    }
  }
}

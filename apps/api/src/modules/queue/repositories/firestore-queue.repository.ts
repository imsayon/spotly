import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../../firebase/firebase.service';
import { QueueRepository } from '../interfaces/queue-repository.interface';
import { QueueEntry, QueueStatus } from '@spotly/types';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreQueueRepository implements QueueRepository {
  private readonly collection = 'queue_entries';

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  async joinQueue(data: Omit<QueueEntry, 'id'>): Promise<QueueEntry> {
    const ref = this.db.collection(this.collection).doc();
    const entry: QueueEntry = { id: ref.id, ...data };
    await ref.set(entry);
    return entry;
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('outletId', '==', outletId)
      .where('status', 'in', ['WAITING', 'CALLED'])
      .orderBy('tokenNumber', 'asc')
      .get();

    return snapshot.docs.map((d) => d.data() as QueueEntry);
  }

  async getEntry(entryId: string): Promise<QueueEntry | null> {
    const doc = await this.db.collection(this.collection).doc(entryId).get();
    return doc.exists ? (doc.data() as QueueEntry) : null;
  }

  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    // Find the next WAITING entry (lowest tokenNumber)
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
  }

  async markMissed(entryId: string): Promise<void> {
    await this.db
      .collection(this.collection)
      .doc(entryId)
      .update({ status: 'MISSED' as QueueStatus });
  }

  async markServed(entryId: string): Promise<void> {
    await this.db
      .collection(this.collection)
      .doc(entryId)
      .update({ status: 'SERVED' as QueueStatus, servedAt: new Date().toISOString() });
  }

  async leaveQueue(entryId: string): Promise<void> {
    await this.db.collection(this.collection).doc(entryId).delete();
  }

  async countWaiting(outletId: string): Promise<number> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('outletId', '==', outletId)
      .where('status', '==', 'WAITING')
      .get();

    return snapshot.size;
  }
}

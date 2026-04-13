import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Outlet } from '@spotly/types';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class OutletService {
  private readonly collection = 'outlets';
  private static readonly memoryStore = new Map<string, Outlet>();

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  private isFirestoreAuthError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return message.includes('UNAUTHENTICATED') || message.includes('invalid authentication credentials');
  }

  async create(merchantId: string, name: string, address?: string): Promise<Outlet> {
    const outlet: Outlet = {
      id: randomUUID(),
      merchantId,
      name,
      address,
      createdAt: new Date().toISOString(),
    };

    try {
      const ref = this.db.collection(this.collection).doc(outlet.id);
      await ref.set(outlet);
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      OutletService.memoryStore.set(outlet.id, outlet);
    }

    return outlet;
  }

  async findById(id: string): Promise<Outlet> {
    try {
      const doc = await this.db.collection(this.collection).doc(id).get();
      if (!doc.exists) {
        throw new NotFoundException(`Outlet ${id} not found`);
      }
      return doc.data() as Outlet;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      const outlet = OutletService.memoryStore.get(id);
      if (!outlet) throw new NotFoundException(`Outlet ${id} not found`);
      return outlet;
    }
  }

  async findByMerchant(merchantId: string): Promise<Outlet[]> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('merchantId', '==', merchantId)
        .get();
      return snapshot.docs.map((d) => d.data() as Outlet);
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      return Array.from(OutletService.memoryStore.values()).filter((o) => o.merchantId === merchantId);
    }
  }

  async update(id: string, merchantId: string, data: any): Promise<Outlet> {
    try {
      const doc = await this.db.collection(this.collection).doc(id).get();
      if (!doc.exists) throw new NotFoundException('Outlet not found');
      if (doc.data()!.merchantId !== merchantId) throw new Error('Unauthorized');

      await this.db.collection(this.collection).doc(id).update(data);
      return { ...doc.data()!, ...data, id };
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      const existing = OutletService.memoryStore.get(id);
      if (!existing) throw new NotFoundException('Outlet not found');
      if (existing.merchantId !== merchantId) throw new Error('Unauthorized');
      const updated = { ...existing, ...data, id } as Outlet;
      OutletService.memoryStore.set(id, updated);
      return updated;
    }
  }

}
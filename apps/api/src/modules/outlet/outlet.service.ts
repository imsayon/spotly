import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Outlet } from '@spotly/types';
import * as admin from 'firebase-admin';

@Injectable()
export class OutletService {
  private readonly collection = 'outlets';

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  async create(merchantId: string, name: string, address?: string): Promise<Outlet> {
    const ref = this.db.collection(this.collection).doc();
    const outlet: Outlet = {
      id: ref.id,
      merchantId,
      name,
      address,
      createdAt: new Date().toISOString(),
    };
    await ref.set(outlet);
    return outlet;
  }

  async findById(id: string): Promise<Outlet> {
    const doc = await this.db.collection(this.collection).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Outlet ${id} not found`);
    }
    return doc.data() as Outlet;
  }

  async findByMerchant(merchantId: string): Promise<Outlet[]> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('merchantId', '==', merchantId)
      .get();
    return snapshot.docs.map((d) => d.data() as Outlet);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Merchant } from '@spotly/types';
import * as admin from 'firebase-admin';

@Injectable()
export class MerchantService {
  private readonly collection = 'merchants';

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  async create(userId: string, name: string, category: string): Promise<Merchant> {
    const ref = this.db.collection(this.collection).doc();
    const merchant: Merchant = {
      id: ref.id,
      userId,
      name,
      category,
      createdAt: new Date().toISOString(),
    };
    await ref.set(merchant);
    return merchant;
  }

  async findById(id: string): Promise<Merchant> {
    const doc = await this.db.collection(this.collection).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Merchant ${id} not found`);
    }
    return doc.data() as Merchant;
  }

  async findAll(): Promise<Merchant[]> {
    const snapshot = await this.db.collection(this.collection).get();
    return snapshot.docs.map((d) => d.data() as Merchant);
  }

  async findByUser(userId: string): Promise<Merchant | null> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Merchant;
  }

  async updateProfile(userId: string, data: Partial<Merchant>): Promise<Merchant> {
    const merchant = await this.findByUser(userId);
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    // Only allow updating specific profile fields (don't overwrite critical IDs)
    const updatePayload = {
      ...(data.name && { name: data.name }),
      ...(data.category && { category: data.category }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    };

    await this.db.collection(this.collection).doc(merchant.id).update(updatePayload);

    // Return the hydrated updated object
    return { ...merchant, ...updatePayload };
  }
}

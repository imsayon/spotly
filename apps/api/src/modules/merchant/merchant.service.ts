import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Merchant } from '@spotly/types';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class MerchantService {
  private readonly collection = 'merchants';
  private static readonly memoryStore = new Map<string, Merchant>();

  private static readonly categoryAliases: Record<string, string[]> = {
    groceries: ['groceries', 'grocery'],
    bakery: ['bakery', 'bakeries'],
    pharmacy: ['pharmacy', 'pharmacies', 'medical'],
    restaurant: ['restaurant', 'food', 'food & beverage', 'cafe', 'café'],
    retail: ['retail', 'store', 'shop'],
  };

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  private isFirestoreAuthError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return message.includes('UNAUTHENTICATED') || message.includes('invalid authentication credentials');
  }

  private matchesCategory(category: string, selectedCategory?: string): boolean {
    if (!selectedCategory || selectedCategory === 'All') return true;
    const selected = selectedCategory.trim().toLowerCase();
    const merchantCategory = category.trim().toLowerCase();
    const aliases = MerchantService.categoryAliases[selected] ?? [selected];
    return aliases.some((alias) => merchantCategory.includes(alias));
  }

  async create(userId: string, name: string, category: string): Promise<Merchant> {
    const existing = await this.findByUser(userId);
    if (existing) {
      return existing;
    }

    const merchant: Merchant = {
      id: randomUUID(),
      userId,
      name,
      category,
      createdAt: new Date().toISOString(),
    };

    try {
      const ref = this.db.collection(this.collection).doc(merchant.id);
      await ref.set(merchant);
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      MerchantService.memoryStore.set(merchant.id, merchant);
    }

    return merchant;
  }

  async findById(id: string): Promise<Merchant> {
    try {
      const doc = await this.db.collection(this.collection).doc(id).get();
      if (!doc.exists) {
        throw new NotFoundException(`Merchant ${id} not found`);
      }
      return doc.data() as Merchant;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      const merchant = MerchantService.memoryStore.get(id);
      if (!merchant) throw new NotFoundException(`Merchant ${id} not found`);
      return merchant;
    }
  }

  async findAll(location?: string, search?: string, category?: string): Promise<Merchant[]> {
    try {
      const snapshot = await this.db.collection(this.collection).get();
      let merchants = snapshot.docs.map((d) => d.data() as Merchant);

      if (location) {
        const lowerLocation = location.toLowerCase();
        merchants = merchants.filter((m) => {
          const merchantLocation = (m as Merchant & { location?: string }).location;
          if (!merchantLocation) return true;
          return merchantLocation.toLowerCase().includes(lowerLocation);
        });
      }

      if (search) {
        const lowerSearch = search.toLowerCase();
        merchants = merchants.filter(
          (m) =>
            m.name.toLowerCase().includes(lowerSearch) ||
            m.category.toLowerCase().includes(lowerSearch),
        );
      }

      merchants = merchants.filter((m) => this.matchesCategory(m.category, category));
      return merchants;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      let merchants = Array.from(MerchantService.memoryStore.values());

      if (location) {
        const lowerLocation = location.toLowerCase();
        merchants = merchants.filter((m) => {
          const merchantLocation = (m as Merchant & { location?: string }).location;
          if (!merchantLocation) return true;
          return merchantLocation.toLowerCase().includes(lowerLocation);
        });
      }

      if (search) {
        const lowerSearch = search.toLowerCase();
        merchants = merchants.filter(
          (m) =>
            m.name.toLowerCase().includes(lowerSearch) ||
            m.category.toLowerCase().includes(lowerSearch),
        );
      }

      merchants = merchants.filter((m) => this.matchesCategory(m.category, category));
      return merchants;
    }
  }

  async findByUser(userId: string): Promise<Merchant | null> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as Merchant;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      return Array.from(MerchantService.memoryStore.values()).find((m) => m.userId === userId) ?? null;
    }
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

    try {
      await this.db.collection(this.collection).doc(merchant.id).update(updatePayload);
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      MerchantService.memoryStore.set(merchant.id, { ...merchant, ...updatePayload });
    }

    // Return the hydrated updated object
    return { ...merchant, ...updatePayload };
  }
}

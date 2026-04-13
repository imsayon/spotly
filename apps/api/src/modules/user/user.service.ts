import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { User, UserRole } from '@spotly/types';
import * as admin from 'firebase-admin';

@Injectable()
export class UserService {
  private readonly collection = 'users';
  private static readonly memoryStore = new Map<string, User>();

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  private isFirestoreAuthError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return message.includes('UNAUTHENTICATED') || message.includes('invalid authentication credentials');
  }

  /**
   * Upsert a user on first login. Creates if not exists, returns existing otherwise.
   */
  async upsertUser(uid: string, email: string, name: string, role: UserRole = 'CONSUMER'): Promise<User> {
    try {
      const ref = this.db.collection(this.collection).doc(uid);
      const doc = await ref.get();

      if (doc.exists) {
        return doc.data() as User;
      }

      const user: User = {
        id: uid,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
      };

      await ref.set(user);
      return user;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      const existing = UserService.memoryStore.get(uid);
      if (existing) return existing;
      const user: User = {
        id: uid,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
      };
      UserService.memoryStore.set(uid, user);
      return user;
    }
  }

  async findById(uid: string): Promise<User | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(uid).get();
      return doc.exists ? (doc.data() as User) : null;
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      return UserService.memoryStore.get(uid) ?? null;
    }
  }

  async updateRole(uid: string, role: UserRole): Promise<void> {
    try {
      await this.db.collection(this.collection).doc(uid).update({ role });
    } catch (err) {
      if (!this.isFirestoreAuthError(err)) throw err;
      const current = UserService.memoryStore.get(uid);
      if (current) {
        UserService.memoryStore.set(uid, { ...current, role });
      }
    }
  }

  async updateProfile(uid: string, data: Partial<User>): Promise<User | null> {
    const updatePayload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.location !== undefined && { location: data.location }),
    };

    if (Object.keys(updatePayload).length > 0) {
      try {
        await this.db.collection(this.collection).doc(uid).update(updatePayload);
      } catch (err) {
        if (!this.isFirestoreAuthError(err)) throw err;
        const current = UserService.memoryStore.get(uid);
        if (current) {
          UserService.memoryStore.set(uid, { ...current, ...updatePayload });
        }
      }
    }

    return this.findById(uid);
  }
}

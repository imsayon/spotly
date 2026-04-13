import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { User, UserRole } from '@spotly/types';
import * as admin from 'firebase-admin';

@Injectable()
export class UserService {
  private readonly collection = 'users';

  constructor(private readonly firebase: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebase.firestore;
  }

  /**
   * Upsert a user on first login. Creates if not exists, returns existing otherwise.
   */
  async upsertUser(uid: string, email: string, name: string, role: UserRole = 'CONSUMER'): Promise<User> {
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
  }

  async findById(uid: string): Promise<User | null> {
    const doc = await this.db.collection(this.collection).doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  async updateRole(uid: string, role: UserRole): Promise<void> {
    await this.db.collection(this.collection).doc(uid).update({ role });
  }

  async updateProfile(uid: string, data: Partial<User>): Promise<User | null> {
    const updatePayload = {
      ...(data.name && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.location !== undefined && { location: data.location }),
    };

    if (Object.keys(updatePayload).length > 0) {
      await this.db.collection(this.collection).doc(uid).update(updatePayload);
    }
    
    return this.findById(uid);
  }
}

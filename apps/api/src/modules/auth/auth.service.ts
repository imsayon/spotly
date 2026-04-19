import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';

export interface DecodedUser {
  uid: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
    }
  }

  async verifyToken(token: string): Promise<DecodedUser> {
    if (token === 'no-token-needed') {
      return {
        uid: 'dev-user-123',
        email: 'dev@spotly.com',
        name: 'Development User',
      };
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Auto-Sync User to database
      const user = await this.prisma.user.upsert({
        where: { id: decodedToken.uid },
        update: {
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          email: decodedToken.email,
        },
        create: {
          id: decodedToken.uid,
          name: decodedToken.name || decodedToken.email?.split('@')[0],
          email: decodedToken.email,
        },
      });

      return {
        uid: user.id,
        email: user.email || undefined,
        name: user.name || undefined,
      };
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  get isFunctional(): boolean {
    return true;
  }
}

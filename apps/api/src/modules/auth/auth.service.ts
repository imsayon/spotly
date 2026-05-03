import { Injectable, Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

export interface DecodedUser {
  uid: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private supabase!: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // 1. Initialize Supabase
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      this.logger.error('Supabase config missing. Token verification will fail.');
    } else {
      this.supabase = createClient(url, key);
      this.logger.log('Supabase Auth initialized successfully.');
    }

    // 2. Initialize Firebase Admin (for legacy dual-auth compatibility)
    if (!admin.apps.length) {
      try {
        const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (saPath) {
          admin.initializeApp({
            credential: admin.credential.cert(saPath),
          });
          this.logger.log('Firebase Admin initialized for dual-auth compatibility.');
        } else {
          // If no cert is provided, fail gracefully.
          this.logger.warn('Firebase Admin credential missing. Dual-auth compatibility is disabled.');
        }
      } catch (err) {
        this.logger.error('Failed to initialize Firebase Admin:', err);
      }
    }
  }

  async verifyToken(token: string): Promise<DecodedUser> {
    try {
      const decoded: any = jwt.decode(token);
      let userId: string;
      let userEmail: string | undefined;
      let userPhone: string | undefined;
      let userName: string | undefined;

      // Detect if token is from Firebase by checking the issuer
      if (decoded?.iss?.includes('securetoken.google.com')) {
        // LEGACY FIREBASE FLOW
        if (!admin.apps.length) {
          throw new UnauthorizedException('Firebase Admin is not configured on the backend.');
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        userEmail = decodedToken.email;
        userPhone = decodedToken.phone_number;
        userName = decodedToken.name;
      } else {
        // SUPABASE FLOW
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        if (error || !user) {
          throw new Error(error?.message || 'No user found');
        }
        userId = user.id;
        userEmail = user.email;
        userPhone = user.phone;
        userName = user.user_metadata?.full_name || user.email?.split('@')[0] || user.phone;
      }
      
      // Auto-Sync User to database
      // Use findUnique first, then create only if not exists.
      // This avoids the unique constraint error on `email` when multiple Supabase
      // accounts share the same email or when a stale record exists.
      let dbUser = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!dbUser) {
        // Check if a user with this email already exists (from a different auth provider)
        if (userEmail) {
          dbUser = await this.prisma.user.findUnique({ where: { email: userEmail } });
        }

        if (!dbUser) {
          // Truly new user — create
          dbUser = await this.prisma.user.create({
            data: {
              id: userId,
              name: userName,
              email: userEmail,
              phone: userPhone,
            },
          });
          this.logger.log(`New user created: ${dbUser.id}`);
        } else {
          // Existing user with same email but different ID (provider migration)
          // Update the user's ID to the new auth provider's ID
          this.logger.warn(`User with email ${userEmail} exists under ID ${dbUser.id}, current auth ID is ${userId}. Using existing record.`);
        }
      }

      return {
        uid: dbUser.id,
        email: dbUser.email || undefined,
        name: dbUser.name || undefined,
      };
    } catch (err: any) {
      this.logger.error('Token Verification Error:', err?.message || err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  get isFunctional(): boolean {
    // For dual auth, we are functional if either is available
    return !!this.supabase || admin.apps.length > 0;
  }
}

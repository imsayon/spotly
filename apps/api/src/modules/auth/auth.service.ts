import { Injectable, Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

export interface DecodedUser {
  uid: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private _firebaseInitialized = false;
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (admin.apps.length > 0) return;

    // Strategy 1: Load from service account JSON file (preferred - always present)
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      path.resolve(process.cwd(), 'spotly-d321e-firebase-adminsdk-fbsvc-27948a752a.json'),
      path.resolve(process.cwd(), 'apps/api/spotly-d321e-firebase-adminsdk-fbsvc-27948a752a.json'),
      path.resolve(__dirname, '../../../../apps/api/spotly-d321e-firebase-adminsdk-fbsvc-27948a752a.json'),
      path.resolve(__dirname, '../../../../../apps/api/spotly-d321e-firebase-adminsdk-fbsvc-27948a752a.json')
    ].filter(Boolean) as string[];

    let saPathFound = false;

    for (const saPath of possiblePaths) {
      if (fs.existsSync(saPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          this._firebaseInitialized = true;
          this.logger.log(`Firebase Admin initialized from service account file at: ${saPath}`);
          saPathFound = true;
          break;
        } catch (e) {
          this.logger.warn(`Failed to load service account file at ${saPath}: ${e}`);
        }
      }
    }

    if (saPathFound) return;

    // Strategy 2: Inline env vars
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      this._firebaseInitialized = true;
      this.logger.log('Firebase Admin initialized from env vars');
      return;
    }

    this.logger.error('⚠️  Firebase Admin NOT initialized — token verification will fail. Provide a service account file.');
  }

  async verifyToken(token: string): Promise<DecodedUser> {

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Auto-Sync User to database (Only create if not exists)
      const user = await this.prisma.user.upsert({
        where: { id: decodedToken.uid },
        update: {}, // Don't overwrite existing data from token on every request
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
      this.logger.error('Firebase Auth Error:', err);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  get isFunctional(): boolean {
    return this._firebaseInitialized;
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private _app!: admin.app.App;

  onModuleInit() {
    if (admin.apps.length > 0) {
      this._app = admin.apps[0]!;
      return;
    }

    // ─── Try service account file first ──────────────────────────────────────
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (saPath) {
      const resolved = path.resolve(saPath);
      if (fs.existsSync(resolved)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
        this._app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialized via service account file');
        return;
      }
    }

    // ─── Fall back to env vars ────────────────────────────────────────────────
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or ' +
          'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY env vars.',
      );
    }

    this._app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    this.logger.log('Firebase Admin initialized via environment variables');
  }

  get auth(): admin.auth.Auth {
    return admin.auth();
  }

  get firestore(): admin.firestore.Firestore {
    return admin.firestore();
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

export interface DecodedUser {
  uid: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Verify a Firebase ID token and return the decoded user payload.
   * Throws UnauthorizedException if token is invalid or expired.
   */
  async verifyToken(idToken: string): Promise<DecodedUser> {
    if (!this.firebase.isFunctional) {
      // Development Bypass: Return a mock user if Firebase is not initialized
      return {
        uid: 'dev-user-123',
        email: 'dev@spotlyy.com',
        name: 'Development User',
      };
    }

    try {
      const decoded = await this.firebase.auth.verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  get isFunctional(): boolean {
    return this.firebase.isFunctional;
  }
}

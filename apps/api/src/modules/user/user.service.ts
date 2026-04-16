import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@spotly/database';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertUser(uid: string, phone: string | null, name: string, role: string = 'CONSUMER'): Promise<User> {
    const existing = await this.findById(uid);
    if (existing) return existing;

    return this.prisma.user.create({
      data: {
        id: uid, // Use Firebase UID as Prisma ID
        phone: phone || undefined,
        name: name,
        role: role as Role,
      },
    });
  }

  async findById(uid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: uid },
    });
  }

  async updateRole(uid: string, role: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: uid },
      data: { role: role as Role },
    });
  }

  async updateProfile(uid: string, data: Partial<User>): Promise<User | null> {
    return this.prisma.user.update({
      where: { id: uid },
      data: {
        name: data.name,
        phone: data.phone,
      },
    });
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favoriteOutlet.findMany({
      where: { userId },
      include: {
        merchant: true,
      },
    });
    return favorites.map((f) => f.merchant);
  }

  async addFavorite(userId: string, merchantId: string) {
    return this.prisma.favoriteOutlet.upsert({
      where: {
        userId_merchantId: { userId, merchantId },
      },
      create: { userId, merchantId },
      update: {},
    });
  }

  async removeFavorite(userId: string, merchantId: string) {
    return this.prisma.favoriteOutlet.delete({
      where: {
        userId_merchantId: { userId, merchantId },
      },
    });
  }
}


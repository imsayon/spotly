import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@spotly/database';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertUser(uid: string, email: string | null, name: string, role: string = 'CONSUMER'): Promise<User> {
    const existing = await this.findById(uid);
    if (existing) return existing;

    return this.prisma.user.create({
      data: {
        id: uid, // Use Firebase UID as Prisma ID
        email: email || undefined,
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
    return this.prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        name: data.name,
        phone: data.phone,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        role: Role.CONSUMER,
      },
      update: {
        name: data.name,
        phone: data.phone,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
      },
    });
  }
}

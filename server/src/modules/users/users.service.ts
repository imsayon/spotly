import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  upsertUser(phone: string, name: string) {
    return this.prisma.user.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
    });
  }

  updatePushToken(id: string, pushToken: string) {
    return this.prisma.user.update({ where: { id }, data: { pushToken } });
  }
}

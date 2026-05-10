import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@spotly/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    try {
      await this.$queryRaw`SELECT 1 FROM "OutletDailyCounter" LIMIT 1`;
    } catch (error) {
      this.logger.error('OutletDailyCounter table missing or inaccessible. Run: prisma migrate deploy');
      throw new Error('Database schema incomplete: OutletDailyCounter table missing or inaccessible');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

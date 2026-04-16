import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MerchantModule } from '../merchant/merchant.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [MerchantModule, PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

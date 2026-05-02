import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { PrismaQueueRepository } from './repositories/prisma-queue.repository';
import { QUEUE_REPOSITORY } from './interfaces/queue-repository.interface';
import { AuthModule } from '../auth/auth.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { MerchantModule } from '../merchant/merchant.module';
import { OutletModule } from '../outlet/outlet.module';

@Module({
  imports: [AuthModule, WebsocketModule, MerchantModule, OutletModule],
  controllers: [QueueController],
  providers: [
    QueueService,
    PrismaQueueRepository,
    // ─── Repository DI binding ──────────────────────────────────────────────
    {
      provide: QUEUE_REPOSITORY,
      useExisting: PrismaQueueRepository,
    },
  ],
})
export class QueueModule {}

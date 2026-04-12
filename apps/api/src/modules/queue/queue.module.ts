import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { FirestoreQueueRepository } from './repositories/firestore-queue.repository';
import { QUEUE_REPOSITORY } from './interfaces/queue-repository.interface';
import { AuthModule } from '../auth/auth.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AuthModule, WebsocketModule],
  controllers: [QueueController],
  providers: [
    QueueService,
    FirestoreQueueRepository,
    // ─── Repository DI binding ──────────────────────────────────────────────
    // To migrate to Prisma later, replace FirestoreQueueRepository with
    // PrismaQueueRepository here. Everything else stays the same.
    {
      provide: QUEUE_REPOSITORY,
      useExisting: FirestoreQueueRepository,
    },
  ],
})
export class QueueModule {}

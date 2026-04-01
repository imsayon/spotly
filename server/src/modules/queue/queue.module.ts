import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        connection: {
          host: cs.get<string>('app.redis.host'),
          port: cs.get<number>('app.redis.port'),
          password: cs.get<string>('app.redis.password') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'queue:miss' }),
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
})
export class QueueModule {}

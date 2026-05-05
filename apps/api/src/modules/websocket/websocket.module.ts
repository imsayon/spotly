import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [QueueGateway],
  exports: [QueueGateway],
})
export class WebsocketModule {}

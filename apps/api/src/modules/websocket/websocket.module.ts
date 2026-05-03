import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [QueueGateway],
  exports: [QueueGateway],
})
export class WebsocketModule {}

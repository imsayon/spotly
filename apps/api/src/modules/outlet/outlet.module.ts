import { Module } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { OutletController } from './outlet.controller';
import { AuthModule } from '../auth/auth.module';
import { MerchantModule } from '../merchant/merchant.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AuthModule, MerchantModule, WebsocketModule],
  providers: [OutletService],
  controllers: [OutletController],
  exports: [OutletService],
})
export class OutletModule {}

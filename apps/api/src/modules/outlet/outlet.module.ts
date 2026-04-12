import { Module } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { OutletController } from './outlet.controller';
import { AuthModule } from '../auth/auth.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [AuthModule, MerchantModule],
  providers: [OutletService],
  controllers: [OutletController],
  exports: [OutletService],
})
export class OutletModule {}

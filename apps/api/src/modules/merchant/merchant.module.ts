import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { AuthModule } from '../auth/auth.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [AuthModule, IntegrationModule],
  providers: [MerchantService],
  controllers: [MerchantController],
  exports: [MerchantService],
})
export class MerchantModule {}

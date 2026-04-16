import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { MerchantService } from '../merchant/merchant.service';

@Controller('analytics')
@UseGuards(FirebaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly merchantService: MerchantService,
  ) {}

  @Get('merchant')
  async getMerchantStats(@CurrentUser() user: DecodedUser) {
    const merchant = await this.merchantService.findByUser(user.uid);
    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }
    const data = await this.analyticsService.getMerchantStats(merchant.id);
    return { success: true, data };
  }
}

import {
  Body, Controller, Get, Param, Post, UseGuards,
} from '@nestjs/common';
import { OutletService } from './outlet.service';
import { MerchantService } from '../merchant/merchant.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateOutletDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;
}

@Controller('outlet')
export class OutletController {
  constructor(
    private readonly outletService: OutletService,
    private readonly merchantService: MerchantService,
  ) {}

  /** GET /api/outlet/:id */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.outletService.findById(id);
    return { success: true, data };
  }

  /** GET /api/outlet/merchant/:merchantId */
  @Get('merchant/:merchantId')
  async findByMerchant(@Param('merchantId') merchantId: string) {
    const data = await this.outletService.findByMerchant(merchantId);
    return { success: true, data };
  }

  /** POST /api/outlet — merchant creates an outlet */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @CurrentUser() user: DecodedUser,
    @Body() body: CreateOutletDto,
  ) {
    // Ensure the authenticated user owns a merchant account
    const merchant = await this.merchantService.findByUser(user.uid);
    if (!merchant) {
      return { success: false, message: 'You must register as a merchant first' };
    }
    const data = await this.outletService.create(merchant.id, body.name, body.address);
    return { success: true, data };
  }
}

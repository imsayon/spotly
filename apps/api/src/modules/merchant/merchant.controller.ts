import {
  Body, Controller, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;
}

class UpdateMerchantDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() logoUrl?: string;
}

@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  /** GET /api/merchant — public: browse all merchants */
  @Get()
  async findAll() {
    const data = await this.merchantService.findAll();
    return { success: true, data };
  }

  /** GET /api/merchant/me/profile — get current merchant's profile */
  @Get('me/profile')
  @UseGuards(FirebaseAuthGuard)
  async getMyMerchant(@CurrentUser() user: DecodedUser) {
    const data = await this.merchantService.findByUser(user.uid);
    return { success: true, data };
  }

  /** GET /api/merchant/:id — public */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.merchantService.findById(id);
    return { success: true, data };
  }

  /** POST /api/merchant — authenticated merchant registration */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @CurrentUser() user: DecodedUser,
    @Body() body: CreateMerchantDto,
  ) {
    const data = await this.merchantService.create(user.uid, body.name, body.category);
    return { success: true, data };
  }

  /** PATCH /api/merchant/me — authenticated merchant update */
  @Patch('me')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(
    @CurrentUser() user: DecodedUser,
    @Body() body: UpdateMerchantDto,
  ) {
    const data = await this.merchantService.updateProfile(user.uid, body);
    return { success: true, data };
  }
}

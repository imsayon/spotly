import {
  Body, Controller, Get, Param, Patch, Post, UseGuards, Query,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateMerchantDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() category!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() address?: string;
  @IsInt() @IsOptional() foundingYear?: number;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() gstNumber?: string;
}

class UpdateMerchantDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() address?: string;
  @IsInt() @IsOptional() foundingYear?: number;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() gstNumber?: string;
}

import { IntegrationService } from '../integration/integration.service';

@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly integrationService: IntegrationService,
  ) {}

  /** GET /api/merchant — public: browse all merchants */
  @Get()
  async findAll(
    @Query('location') location?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
  ) {
    const safeLocation = location?.trim();
    const safeQuery = q?.trim();
    const safeCategory = category?.trim();

    if (safeLocation) {
      try {
        const coords = await this.integrationService.geocode(safeLocation);
        if (coords) {
          const [externalMerchants, internalMerchants] = await Promise.all([
            this.integrationService.fetchShops(coords.lat, coords.lon, 10000, safeCategory),
            this.merchantService.findAll(safeLocation, safeQuery, safeCategory),
          ]);

          const filteredExternal = safeQuery
            ? externalMerchants.filter((merchant) =>
                merchant.name.toLowerCase().includes(safeQuery.toLowerCase()) ||
                merchant.category.toLowerCase().includes(safeQuery.toLowerCase()),
              )
            : externalMerchants;

          return {
            success: true,
            data: [...filteredExternal, ...internalMerchants],
            meta: {
              location: coords.displayName,
              coords: { lat: coords.lat, lon: coords.lon },
            },
          };
        }
      } catch {
        // Fallback to internal merchants if geocoding/vendor API is unavailable.
      }
    }

    const data = await this.merchantService.findAll(safeLocation, safeQuery, safeCategory);
    return {
      success: true,
      data,
      meta: safeLocation ? { location: safeLocation } : undefined,
    };
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
    const data = await this.merchantService.create(user.uid, body);
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

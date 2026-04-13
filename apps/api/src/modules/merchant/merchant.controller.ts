import {
  Body, Controller, Get, Param, Patch, Post, UseGuards, Query,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
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

import { IntegrationService } from '../integration/integration.service';

@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly integrationService: IntegrationService,
    private readonly firebase: FirebaseService,
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
      const coords = await this.integrationService.geocode(safeLocation);
      if (coords) {
        const [externalMerchants, internalMerchants] = await Promise.all([
          this.integrationService.fetchShops(coords.lat, coords.lon, 10000, safeCategory),
          this.firebase.isFunctional
            ? this.merchantService.findAll(safeLocation, safeQuery)
            : Promise.resolve([]),
        ]);

        const filteredExternal = safeQuery
          ? externalMerchants.filter((merchant) =>
              merchant.name.toLowerCase().includes(safeQuery.toLowerCase()) ||
              merchant.category.toLowerCase().includes(safeQuery.toLowerCase()),
            )
          : externalMerchants;

        const filteredInternal = safeCategory && safeCategory !== 'All'
          ? internalMerchants.filter((merchant) =>
              merchant.category.toLowerCase().includes(safeCategory.toLowerCase()),
            )
          : internalMerchants;

        return {
          success: true,
          data: [...filteredExternal, ...filteredInternal],
          meta: {
            location: coords.displayName,
            coords: { lat: coords.lat, lon: coords.lon },
          },
        };
      }
    }

    if (this.firebase.isFunctional) {
      const data = await this.merchantService.findAll(safeLocation, safeQuery);
      return { success: true, data };
    }

    return {
      success: true,
      data: [],
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

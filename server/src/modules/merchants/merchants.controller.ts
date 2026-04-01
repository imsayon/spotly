import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MerchantsService } from './merchants.service';

class CreateMerchantDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() address: string;
  @IsNumber() @Type(() => Number) lat: number;
  @IsNumber() @Type(() => Number) lng: number;
}

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  /** POST /api/v1/merchants — Register a new merchant */
  @Post()
  create(@Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(dto);
  }

  /** GET /api/v1/merchants?lat=&lng=&category=&radius= — Nearby merchants */
  @Get()
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('category') category?: string,
    @Query('radius') radius?: string,
  ) {
    return this.merchantsService.findNearby({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      category,
      radiusKm: radius ? parseFloat(radius) : 5,
    });
  }
}

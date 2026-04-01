import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateMerchantDto {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
}

interface FindNearbyParams {
  lat: number;
  lng: number;
  category?: string;
  radiusKm: number;
}

/** Haversine great-circle distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMerchantDto) {
    return this.prisma.merchant.create({ data: dto });
  }

  async findNearby({ lat, lng, category, radiusKm }: FindNearbyParams) {
    const merchants = await this.prisma.merchant.findMany({
      where: category ? { category } : undefined,
      include: { queueState: true },
    });

    return merchants
      .map((m) => ({ ...m, distanceKm: haversineKm(lat, lng, m.lat, m.lng) }))
      .filter((m) => m.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

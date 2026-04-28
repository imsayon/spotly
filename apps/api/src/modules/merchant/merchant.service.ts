import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Merchant } from '@spotly/database';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: Partial<Merchant>): Promise<Merchant> {
    console.log(`[MerchantService] Creating merchant for user: ${userId}`);
    
    const existing = await this.findByUser(userId);
    if (existing) {
      console.log(`[MerchantService] Merchant already exists for user: ${userId}`);
      return this.updateProfile(userId, data);
    }

    try {
      // 1. Ensure user exists and promote role
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.error(`[MerchantService] User record ${userId} not found in database. Sync might have failed.`);
        throw new NotFoundException('User profile not synchronized with database. Please try logging in again.');
      }

      console.log(`[MerchantService] Promoting user ${userId} to MERCHANT role`);
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'MERCHANT' },
      });

      // 2. Generate a user-facing Spot ID (e.g., SPOT-82A1)
      const spotId = `SPOT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      console.log(`[MerchantService] Generated SpotID: ${spotId}`);

      // 3. Create Merchant
      const merchant = await this.prisma.merchant.create({
        data: {
          ownerId: userId,
          spotId,
          name: data.name || 'Set Your Business Name',
          category: data.category || 'General',
          description: data.description,
          phone: data.phone,
          contactEmail: data.contactEmail,
          website: data.website,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          foundingYear: data.foundingYear,
          logoUrl: data.logoUrl,
          gstNumber: data.gstNumber,
        },
      });

      console.log(`[MerchantService] Successfully created merchant: ${merchant.id}`);
      return merchant;
    } catch (err) {
      console.error('[MerchantService] Create operation failed:', err);
      throw err;
    }
  }


  async findById(id: string): Promise<Merchant> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        outlets: true,
      },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${id} not found`);
    }
    return merchant;
  }

  async findAll(
    location?: string,
    search?: string,
    category?: string,
    lat?: number,
    lng?: number,
    radiusMeters?: number,
  ): Promise<Array<Merchant & { distanceKm?: number }>> {
    const merchants = await this.prisma.merchant.findMany({
      where: {
        ...(category && category !== 'All' && { category: { contains: category, mode: 'insensitive' } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        outlets: true,
      },
    });

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasCoords) return merchants;

    const maxDistanceKm = Number.isFinite(radiusMeters) ? (radiusMeters as number) / 1000 : undefined;

    return merchants
      .map((merchant) => {
        const candidates = [
          Number.isFinite(merchant.lat) && Number.isFinite(merchant.lng)
            ? { lat: merchant.lat as number, lng: merchant.lng as number }
            : null,
          ...merchant.outlets
            .filter((outlet) => Number.isFinite(outlet.lat) && Number.isFinite(outlet.lng))
            .map((outlet) => ({ lat: outlet.lat as number, lng: outlet.lng as number })),
        ].filter(Boolean) as Array<{ lat: number; lng: number }>;

        const distanceKm = candidates.length
          ? Math.min(...candidates.map((point) => this.distanceKm(lat as number, lng as number, point.lat, point.lng)))
          : undefined;

        return { ...merchant, distanceKm };
      })
      .filter((merchant) => merchant.distanceKm === undefined || maxDistanceKm === undefined || merchant.distanceKm <= maxDistanceKm)
      .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
  }

  async findByUser(userId: string): Promise<Merchant | null> {
    return this.prisma.merchant.findUnique({
      where: { ownerId: userId },
      include: {
        outlets: true,
      },
    });
  }

  async updateProfile(userId: string, data: Partial<Merchant>): Promise<Merchant> {
    console.log(`[MerchantService] Updating profile for user: ${userId}`);
    
    try {
      const merchant = await this.findByUser(userId);
      if (!merchant) {
        console.error(`[MerchantService] Profile update failed: No merchant found for user ${userId}`);
        throw new NotFoundException('Merchant profile not found');
      }

      console.log(`[MerchantService] Applying updates to merchant: ${merchant.id}`);
      const updated = await this.prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          name: data.name,
          category: data.category,
          description: data.description,
          phone: data.phone,
          contactEmail: data.contactEmail,
          website: data.website,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          foundingYear: data.foundingYear,
          logoUrl: data.logoUrl,
          gstNumber: data.gstNumber,
        },
        include: {
          outlets: true,
        },
      });

      console.log(`[MerchantService] Successfully updated merchant: ${updated.id}`);
      return updated;
    } catch (err) {
      console.error('[MerchantService] Update profile failed:', err);
      throw err;
    }
  }

  private distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(toLat - fromLat);
    const dLng = this.toRadians(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(fromLat)) *
        Math.cos(this.toRadians(toLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}

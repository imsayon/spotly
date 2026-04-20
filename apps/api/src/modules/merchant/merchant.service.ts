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
      return existing;
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

  async findAll(location?: string, search?: string, category?: string): Promise<Merchant[]> {
    return this.prisma.merchant.findMany({
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
}

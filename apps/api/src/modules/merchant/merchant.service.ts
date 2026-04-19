import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Merchant } from '@spotly/database';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: Partial<Merchant>): Promise<Merchant> {
    const existing = await this.findByUser(userId);
    if (existing) {
      return existing;
    }

    return this.prisma.merchant.create({
      data: {
        ownerId: userId,
        name: data.name || 'Set Your Business Name',
        category: data.category || 'General',
        description: data.description,
        phone: data.phone,
        contactEmail: data.contactEmail,
        website: data.website,
        address: data.address,
        foundingYear: data.foundingYear,
        logoUrl: data.logoUrl,
        gstNumber: data.gstNumber,
      },
    });
  }

  async findById(id: string): Promise<Merchant> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
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
    });
  }

  async findByUser(userId: string): Promise<Merchant | null> {
    return this.prisma.merchant.findUnique({
      where: { ownerId: userId },
    });
  }

  async updateProfile(userId: string, data: Partial<Merchant>): Promise<Merchant> {
    const merchant = await this.findByUser(userId);
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        phone: data.phone,
        contactEmail: data.contactEmail,
        website: data.website,
        address: data.address,
        foundingYear: data.foundingYear,
        logoUrl: data.logoUrl,
        gstNumber: data.gstNumber,
      },
    });
  }
}

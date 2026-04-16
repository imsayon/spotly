import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Outlet } from '@spotly/database';

@Injectable()
export class OutletService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, name: string, address: string = ''): Promise<Outlet> {
    return this.prisma.outlet.create({
      data: {
        merchantId,
        name,
        address,
      },
    });
  }

  async findById(id: string): Promise<Outlet> {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id },
    });
    if (!outlet) {
      throw new NotFoundException(`Outlet ${id} not found`);
    }
    return outlet;
  }

  async findByMerchant(merchantId: string): Promise<Outlet[]> {
    return this.prisma.outlet.findMany({
      where: { merchantId },
    });
  }

  async update(id: string, merchantId: string, data: Partial<Outlet>): Promise<Outlet> {
    const outlet = await this.prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new NotFoundException('Outlet not found');
    if (outlet.merchantId !== merchantId) throw new Error('Unauthorized');

    return this.prisma.outlet.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        isActive: data.isActive,
      },
    });
  }
}
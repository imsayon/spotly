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
      include: {
        merchant: true,
      },
    });
    if (!outlet) {
      throw new NotFoundException(`Outlet ${id} not found`);
    }
    return outlet;
  }

  async findAll() {
    const outlets = await this.prisma.outlet.findMany({
      include: {
        merchant: true,
        _count: {
          select: {
            queues: true, // This is total, we might want WAITING only if schema allows it in _count
          },
        },
      },
    });

    // In many Prisma versions, _count doesn't support complex where clauses.
    // For now, let's fetch WAITING count manually if needed, or just return total for explore.
    // Realistically, we'd use a more complex aggregate or raw query for performance.
    return outlets;
  }

  async findByMerchant(merchantId: string) {
    const outlets = await this.prisma.outlet.findMany({
      where: { merchantId },
    });

    // Manually add queue counts for now for simplicity/correctness
    const outletsWithCounts = await Promise.all(
      outlets.map(async (o) => {
        const count = await this.prisma.queueEntry.count({
          where: { outletId: o.id, status: 'WAITING' },
        });
        return { ...o, queueCount: count };
      }),
    );

    return outletsWithCounts;
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
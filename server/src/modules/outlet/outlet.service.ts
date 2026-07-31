import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateOutletDto, UpdateOutletDto } from "@spotly/types";

@Injectable()
export class OutletService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id },
      include: {
        merchant: true,
        menuCategories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet ${id} not found`);
    }

    return outlet;
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.outlet.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateOutletDto) {
    return this.prisma.outlet.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateOutletDto) {
    return this.prisma.outlet.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.outlet.update({
      where: { id },
      data: { isActive },
    });
  }
}

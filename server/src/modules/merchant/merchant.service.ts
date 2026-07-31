import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateMerchantDto, UpdateMerchantDto } from "@spotly/types";

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        verified: true,
        logoUrl: true,
        address: true,
        lat: true,
        lng: true,
        outlets: {
          select: {
            id: true,
            name: true,
            isActive: true,
            openTime: true,
            closeTime: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
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

  async findByOwner(ownerId: string) {
    return this.prisma.merchant.findUnique({
      where: { ownerId },
      include: { outlets: true },
    });
  }

  async create(ownerId: string, dto: CreateMerchantDto) {
    return this.prisma.merchant.create({
      data: {
        ownerId,
        ...dto,
      },
    });
  }

  async update(id: string, dto: UpdateMerchantDto) {
    return this.prisma.merchant.update({
      where: { id },
      data: dto,
    });
  }
}

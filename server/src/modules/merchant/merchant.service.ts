import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateMerchantDto, UpdateMerchantDto } from "@spotly/types";

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.merchant.findMany({
      where: { outlets: { some: { isActive: true } } },
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
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
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
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        verified: true,
        logoUrl: true,
        phone: true,
        address: true,
        website: true,
        lat: true,
        lng: true,
        spotId: true,
        createdAt: true,
        updatedAt: true,
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
        ...dto,
        ownerId,
      },
    });
  }

  async update(id: string, dto: UpdateMerchantDto, userId: string) {
    const owned = await this.prisma.merchant.findFirst({ where: { id, ownerId: userId } });
    if (!owned) throw new ForbiddenException("You do not own this business");
    return this.prisma.merchant.update({
      where: { id },
      data: dto,
    });
  }
}

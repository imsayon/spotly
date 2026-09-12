import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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

  async create(dto: CreateOutletDto, userId: string) {
    const owned = await this.prisma.merchant.findFirst({ where: { id: dto.merchantId, ownerId: userId } });
    if (!owned) throw new ForbiddenException("You do not own this business");
    return this.prisma.outlet.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateOutletDto, userId: string) {
    await this.prisma.assertOutletOwner(id, userId);
    return this.prisma.outlet.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string, isActive: boolean, userId: string) {
    await this.prisma.assertOutletOwner(id, userId);
    return this.prisma.outlet.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string, userId: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const outlet = await tx.outlet.findUnique({ where: { id }, select: { id: true, isActive: true, merchant: { select: { ownerId: true } } } });
          if (!outlet) throw new NotFoundException(`Outlet ${id} not found`);
          if (outlet.merchant.ownerId !== userId) throw new ForbiddenException("You do not own this outlet");
          if (outlet.isActive) throw new ConflictException("Pause this outlet before deleting it");
          const activeEntry = await tx.queueEntry.findFirst({ where: { outletId: id, status: { in: ["PENDING_ACCEPTANCE", "WAITING", "CALLED"] } }, select: { id: true } });
          if (activeEntry) throw new ConflictException("This outlet has active queue entries. Serve or close them before deleting it.");
          return tx.outlet.delete({ where: { id } });
        }, { isolationLevel: "Serializable" });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException("The outlet changed. Refresh and try again.");
  }
}

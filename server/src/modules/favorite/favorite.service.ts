import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleFavorite(userId: string, outletId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_outletId: { userId, outletId },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, outletId } });
      return { isFavorite: true };
    }
  }

  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        outlet: {
          include: { merchant: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

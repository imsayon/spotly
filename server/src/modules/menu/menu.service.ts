import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateMenuCategoryDto, CreateMenuItemDto } from "@spotly/types";

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getOutletMenu(outletId: string) {
    return this.prisma.menuCategory.findMany({
      where: { outletId },
      orderBy: { order: "asc" },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  async createCategory(dto: CreateMenuCategoryDto) {
    return this.prisma.menuCategory.create({ data: dto });
  }

  async createItem(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({ data: dto });
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Menu item ${itemId} not found`);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });
  }

  async deleteItem(itemId: string) {
    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }
}

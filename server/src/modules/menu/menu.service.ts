import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateMenuCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from "@spotly/types";

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertItemOwner(itemId: string, userId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId }, include: { category: true } });
    if (!item) throw new NotFoundException("Item not found");
    await this.prisma.assertOutletOwner(item.category.outletId, userId);
  }

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

  async createCategory(dto: CreateMenuCategoryDto, userId: string) {
    await this.prisma.assertOutletOwner(dto.outletId, userId);
    return this.prisma.menuCategory.create({ data: dto });
  }

  async createItem(dto: CreateMenuItemDto, userId: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException("Category not found");
    await this.prisma.assertOutletOwner(category.outletId, userId);
    return this.prisma.menuItem.create({ data: dto });
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean, userId: string) {
    await this.assertItemOwner(itemId, userId);
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Menu item ${itemId} not found`);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });
  }

  async deleteItem(itemId: string, userId: string) {
    await this.assertItemOwner(itemId, userId);
    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }

  async updateItem(itemId: string, dto: UpdateMenuItemDto, userId: string) {
    await this.assertItemOwner(itemId, userId);
    return this.prisma.menuItem.update({ where: { id: itemId }, data: dto });
  }
}

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(outletId: string) {
    return this.prisma.menuCategory.findMany({
      where: { outletId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createCategory(userId: string, outletId: string, name: string) {
    await this.verifyOwnership(userId, outletId);
    return this.prisma.menuCategory.create({
      data: {
        outletId,
        name,
      },
    });
  }

  async updateCategory(userId: string, categoryId: string, name: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    await this.verifyOwnership(userId, category.outletId);

    return this.prisma.menuCategory.update({
      where: { id: categoryId },
      data: { name },
    });
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    await this.verifyOwnership(userId, category.outletId);

    return this.prisma.menuCategory.delete({
      where: { id: categoryId },
    });
  }

  async createItem(userId: string, categoryId: string, data: any) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    await this.verifyOwnership(userId, category.outletId);

    return this.prisma.menuItem.create({
      data: {
        categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  async updateItem(userId: string, itemId: string, data: any) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    await this.verifyOwnership(userId, item.category.outletId);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        isAvailable: data.isAvailable,
      },
    });
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    await this.verifyOwnership(userId, item.category.outletId);

    return this.prisma.menuItem.delete({
      where: { id: itemId },
    });
  }

  private async verifyOwnership(userId: string, outletId: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      include: { merchant: true },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    if (outlet.merchant.ownerId !== userId) {
      throw new ForbiddenException('You do not own this outlet');
    }
  }
}

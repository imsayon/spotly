import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    userId: string,
    outletId: string,
    rating: number,
    comment?: string,
  ) {
    // Verify the user actually used this outlet
    const entry = await this.prisma.queueEntry.findFirst({
      where: { userId, outletId, status: 'SERVED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!entry) {
      throw new ForbiddenException('You can only review outlets you have been served at');
    }
    // Prevent double-review for same visit (within 24h)
    const recentReview = await this.prisma.review.findFirst({
      where: {
        userId,
        outletId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentReview) {
      // Update instead of creating duplicate
      return this.prisma.review.update({
        where: { id: recentReview.id },
        data: { rating, comment },
      });
    }
    return this.prisma.review.create({
      data: { userId, outletId, rating, comment },
    });
  }

  async getMerchantRating(merchantId: string) {
    const outlets = await this.prisma.outlet.findMany({
      where: { merchantId },
      select: { id: true },
    });
    const outletIds = outlets.map(o => o.id);
    const agg = await this.prisma.review.aggregate({
      where: { outletId: { in: outletIds } },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      count: agg._count.id,
    };
  }
}

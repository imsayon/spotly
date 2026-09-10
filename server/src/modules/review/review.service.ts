import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../infra/prisma/prisma.service"
import { CreateReviewDto } from "@spotly/types"

@Injectable()
export class ReviewService {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateReviewDto) {
		return this.prisma.review.upsert({
			where: {
				userId_outletId: {
					userId,
					outletId: dto.outletId,
				},
			},
			update: {
				rating: dto.rating,
				comment: dto.comment,
			},
			create: {
				userId,
				outletId: dto.outletId,
				rating: dto.rating,
				comment: dto.comment,
			},
		})
	}

  async getOutletReviews(outletId: string) {
		return this.prisma.review.findMany({
			where: { outletId },
			include: {
				user: {
					select: { name: true },
				},
			},
			orderBy: { createdAt: "desc" },
		})
  }

  async getOutletStats(outletId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { outletId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { avgRating: aggregate._avg.rating ?? 0, count: aggregate._count._all };
  }
}

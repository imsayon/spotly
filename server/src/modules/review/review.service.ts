import { ForbiddenException, Injectable } from "@nestjs/common"
import { PrismaService } from "../../infra/prisma/prisma.service"
import { CreateReviewDto } from "@spotly/types"

@Injectable()
export class ReviewService {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateReviewDto) {
		const servedVisit = await this.prisma.queueEntry.findFirst({
			where: { userId, outletId: dto.outletId, status: "SERVED" },
			select: { id: true },
		})
		if (!servedVisit) throw new ForbiddenException("Reviews are available after a served visit")

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
			select: {
				id: true,
				outletId: true,
				rating: true,
				comment: true,
				createdAt: true,
				user: {
					select: { name: true },
				},
			},
			orderBy: { createdAt: "desc" },
		})
  }

	async getMyReview(userId: string, outletId: string) {
		const [review, servedVisit] = await Promise.all([
			this.prisma.review.findUnique({
				where: { userId_outletId: { userId, outletId } },
				select: { id: true, outletId: true, rating: true, comment: true, createdAt: true },
			}),
			this.prisma.queueEntry.findFirst({
				where: { userId, outletId, status: "SERVED" },
				select: { id: true },
			}),
		])
		return { review, eligible: !!servedVisit }
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

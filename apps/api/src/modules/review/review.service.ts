import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ForbiddenException,
} from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import { Review } from "@spotly/types"

@Injectable()
export class ReviewService {
	constructor(private readonly prisma: PrismaService) {}

	async createReview(
		userId: string,
		outletId: string,
		rating: number,
		comment?: string,
	): Promise<Review> {
		if (rating < 1 || rating > 5) {
			throw new BadRequestException("Rating must be between 1 and 5")
		}

		// Check if outlet exists
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
		})
		if (!outlet) {
			throw new NotFoundException(`Outlet ${outletId} not found`)
		}

		// Check if user has already reviewed this outlet
		const existingReview = await this.prisma.review.findFirst({
			where: {
				userId,
				outletId,
			},
		})

		if (existingReview) {
			throw new BadRequestException(
				"You have already reviewed this outlet. Use update to modify your review.",
			)
		}

		const review = await this.prisma.review.create({
			data: {
				userId,
				outletId,
				rating,
				comment,
			},
		})

		return review
	}

	async updateReview(
		reviewId: string,
		userId: string,
		rating?: number,
		comment?: string,
	): Promise<Review> {
		const review = await this.prisma.review.findUnique({
			where: { id: reviewId },
		})

		if (!review) {
			throw new NotFoundException(`Review ${reviewId} not found`)
		}

		if (review.userId !== userId) {
			throw new ForbiddenException("You can only update your own reviews")
		}

		if (rating && (rating < 1 || rating > 5)) {
			throw new BadRequestException("Rating must be between 1 and 5")
		}

		const updated = await this.prisma.review.update({
			where: { id: reviewId },
			data: {
				...(rating !== undefined && { rating }),
				...(comment !== undefined && { comment }),
			},
		})

		return updated
	}

	async deleteReview(reviewId: string, userId: string): Promise<void> {
		const review = await this.prisma.review.findUnique({
			where: { id: reviewId },
		})

		if (!review) {
			throw new NotFoundException(`Review ${reviewId} not found`)
		}

		if (review.userId !== userId) {
			throw new ForbiddenException("You can only delete your own reviews")
		}

		await this.prisma.review.delete({
			where: { id: reviewId },
		})
	}

	async getOutletReviews(outletId: string): Promise<Review[]> {
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
		})

		if (!outlet) {
			throw new NotFoundException(`Outlet ${outletId} not found`)
		}

		return this.prisma.review.findMany({
			where: { outletId },
			orderBy: { createdAt: "desc" },
		})
	}

	async getUserReview(
		userId: string,
		outletId: string,
	): Promise<Review | null> {
		return this.prisma.review.findFirst({
			where: {
				userId,
				outletId,
			},
		})
	}

	async getUserReviews(userId: string): Promise<Review[]> {
		return this.prisma.review.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		})
	}

	async getOutletAverageRating(outletId: string): Promise<number> {
		const result = await this.prisma.review.aggregate({
			where: { outletId },
			_avg: {
				rating: true,
			},
		})

		return result._avg.rating || 0
	}

	async getOutletReviewCount(outletId: string): Promise<number> {
		return this.prisma.review.count({
			where: { outletId },
		})
	}
}

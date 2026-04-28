import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
} from "@nestjs/common"
import { ReviewService } from "./review.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"

@Controller("review")
@UseGuards(FirebaseAuthGuard)
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Post()
	async createReview(
		@CurrentUser() user: DecodedUser,
		@Body("outletId") outletId: string,
		@Body("rating") rating: number,
		@Body("comment") comment?: string,
	) {
		const data = await this.reviewService.createReview(
			user.uid,
			outletId,
			rating,
			comment,
		)
		return { success: true, data }
	}

	@Patch(":id")
	async updateReview(
		@CurrentUser() user: DecodedUser,
		@Param("id") reviewId: string,
		@Body("rating") rating?: number,
		@Body("comment") comment?: string,
	) {
		const data = await this.reviewService.updateReview(
			reviewId,
			user.uid,
			rating,
			comment,
		)
		return { success: true, data }
	}

	@Delete(":id")
	async deleteReview(
		@CurrentUser() user: DecodedUser,
		@Param("id") reviewId: string,
	) {
		await this.reviewService.deleteReview(reviewId, user.uid)
		return { success: true }
	}

	@Get("outlet/:outletId")
	async getOutletReviews(@Param("outletId") outletId: string) {
		const reviews = await this.reviewService.getOutletReviews(outletId)
		const avgRating =
			await this.reviewService.getOutletAverageRating(outletId)
		const count = await this.reviewService.getOutletReviewCount(outletId)
		return {
			success: true,
			data: reviews,
			stats: { avgRating, count },
		}
	}

	@Get("outlet/:outletId/user-review")
	async getUserReview(
		@CurrentUser() user: DecodedUser,
		@Param("outletId") outletId: string,
	) {
		const data = await this.reviewService.getUserReview(user.uid, outletId)
		return { success: true, data }
	}

	@Get("user")
	async getUserReviews(@CurrentUser() user: DecodedUser) {
		const data = await this.reviewService.getUserReviews(user.uid)
		return { success: true, data }
	}

	@Get("outlet/:outletId/stats")
	async getOutletStats(@Param("outletId") outletId: string) {
		const avgRating =
			await this.reviewService.getOutletAverageRating(outletId)
		const count = await this.reviewService.getOutletReviewCount(outletId)
		return {
			success: true,
			data: { avgRating, count },
		}
	}
}

import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
	ParseUUIDPipe,
} from "@nestjs/common"
import { ReviewService } from "./review.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"
import {
	IsString,
	IsNotEmpty,
	IsUUID,
	IsInt,
	Min,
	Max,
	IsOptional,
} from "class-validator"

class CreateReviewDto {
	@IsString()
	@IsNotEmpty()
	@IsUUID()
	outletId!: string

	@IsInt()
	@Min(1)
	@Max(5)
	rating!: number

	@IsString()
	@IsOptional()
	comment?: string
}

class UpdateReviewDto {
	@IsInt()
	@Min(1)
	@Max(5)
	@IsOptional()
	rating?: number

	@IsString()
	@IsOptional()
	comment?: string
}

@Controller("review")
@UseGuards(FirebaseAuthGuard)
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Post()
	async createReview(
		@CurrentUser() user: DecodedUser,
		@Body() body: CreateReviewDto,
	) {
		const data = await this.reviewService.createReview(
			user.uid,
			body.outletId,
			body.rating,
			body.comment,
		)
		return { success: true, data }
	}

	@Patch(":id")
	async updateReview(
		@CurrentUser() user: DecodedUser,
		@Param("id", ParseUUIDPipe) reviewId: string,
		@Body() body: UpdateReviewDto,
	) {
		const data = await this.reviewService.updateReview(
			reviewId,
			user.uid,
			body.rating,
			body.comment,
		)
		return { success: true, data }
	}

	@Delete(":id")
	async deleteReview(
		@CurrentUser() user: DecodedUser,
		@Param("id", ParseUUIDPipe) reviewId: string,
	) {
		await this.reviewService.deleteReview(reviewId, user.uid)
		return { success: true }
	}

	@Get("outlet/:outletId")
	async getOutletReviews(@Param("outletId", ParseUUIDPipe) outletId: string) {
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
		@Param("outletId", ParseUUIDPipe) outletId: string,
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

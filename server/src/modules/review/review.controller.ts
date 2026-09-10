import { CreateReviewDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { ReviewService } from "./review.service"
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard"
import { CurrentUser } from "../../infra/auth/current-user.decorator"
import { CreateReviewDto } from "@spotly/types"

@ApiTags("Review")
@Controller("review")
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Create or update review for an outlet" })
	async createReview(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(CreateReviewDtoSchema)) dto: CreateReviewDto,
	) {
		return this.reviewService.create(userId, dto)
	}

	@Get("outlet/:outletId")
	@ApiOperation({ summary: "Get all reviews for an outlet" })
	async getOutletReviews(@Param("outletId") outletId: string) {
		return this.reviewService.getOutletReviews(outletId)
	}

	@Get("outlet/:outletId/stats")
	async getOutletStats(@Param("outletId") outletId: string) {
		return this.reviewService.getOutletStats(outletId)
	}
}

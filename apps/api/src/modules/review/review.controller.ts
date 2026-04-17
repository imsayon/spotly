import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

class CreateReviewDto {
  @IsUUID()
  outletId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(@CurrentUser() user: DecodedUser, @Body() body: CreateReviewDto) {
    const data = await this.reviewService.createReview(
      user.uid, body.outletId, body.rating, body.comment
    );
    return { success: true, data };
  }

  @Get('merchant/:merchantId')
  async getMerchantRating(@Param('merchantId') merchantId: string) {
    const data = await this.reviewService.getMerchantRating(merchantId);
    return { success: true, data };
  }
}

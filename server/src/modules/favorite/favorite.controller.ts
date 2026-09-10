import { JoinQueueDto, JoinQueueDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { Controller, Body, Delete, Get, Post, Param, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { FavoriteService } from "./favorite.service"
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard"
import { CurrentUser } from "../../infra/auth/current-user.decorator"

@ApiTags("Favorite")
@Controller("favorite")
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async add(@CurrentUser("id") userId: string, @Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto) {
    return this.favoriteService.add(userId, dto.outletId);
  }

  @Delete(":outletId")
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser("id") userId: string, @Param("outletId") outletId: string) {
    return this.favoriteService.remove(userId, outletId);
  }

	@Post("toggle/:outletId")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Toggle outlet as favorite for user" })
	async toggleFavorite(
		@CurrentUser("id") userId: string,
		@Param("outletId") outletId: string,
	) {
		return this.favoriteService.toggleFavorite(userId, outletId)
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all user favorite outlets" })
	async getFavorites(@CurrentUser("id") userId: string) {
		return this.favoriteService.getUserFavorites(userId)
	}
}

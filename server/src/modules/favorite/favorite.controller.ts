import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { FavoriteService } from "./favorite.service"
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard"
import { CurrentUser } from "../../infra/auth/current-user.decorator"

@ApiTags("Favorite")
@Controller("favorite")
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

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

	@Get("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all user favorite outlets" })
	async getFavorites(@CurrentUser("id") userId: string) {
		return this.favoriteService.getUserFavorites(userId)
	}
}

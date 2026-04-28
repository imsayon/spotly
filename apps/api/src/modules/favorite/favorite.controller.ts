import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	UseGuards,
	Body,
} from "@nestjs/common"
import { FavoriteService } from "./favorite.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"

@Controller("favorite")
@UseGuards(FirebaseAuthGuard)
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

	@Post()
	async addFavorite(
		@CurrentUser() user: DecodedUser,
		@Body("outletId") outletId: string,
	) {
		const data = await this.favoriteService.addFavorite(user.uid, outletId)
		return { success: true, data }
	}

	@Delete(":outletId")
	async removeFavorite(
		@CurrentUser() user: DecodedUser,
		@Param("outletId") outletId: string,
	) {
		await this.favoriteService.removeFavorite(user.uid, outletId)
		return { success: true }
	}

	@Get()
	async getUserFavorites(@CurrentUser() user: DecodedUser) {
		const data = await this.favoriteService.getUserFavoritesWithOutlets(
			user.uid,
		)
		return { success: true, data }
	}

	@Get(":outletId/check")
	async isFavorite(
		@CurrentUser() user: DecodedUser,
		@Param("outletId") outletId: string,
	) {
		const isFavorite = await this.favoriteService.isFavorite(
			user.uid,
			outletId,
		)
		return { success: true, data: { isFavorite } }
	}
}

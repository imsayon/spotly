import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import { Favorite } from "@spotly/types"

@Injectable()
export class FavoriteService {
	constructor(private readonly prisma: PrismaService) {}

	async addFavorite(userId: string, outletId: string): Promise<Favorite> {
		// Check if outlet exists
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
		})
		if (!outlet) {
			throw new NotFoundException(`Outlet ${outletId} not found`)
		}

		// Create or return existing favorite
		const favorite = await this.prisma.favorite.upsert({
			where: {
				userId_outletId: {
					userId,
					outletId,
				},
			},
			update: {},
			create: {
				userId,
				outletId,
			},
		})

		return favorite
	}

	async removeFavorite(userId: string, outletId: string): Promise<void> {
		await this.prisma.favorite.deleteMany({
			where: {
				userId,
				outletId,
			},
		})
	}

	async getUserFavorites(userId: string): Promise<Favorite[]> {
		return this.prisma.favorite.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		})
	}

	async getUserFavoritesWithOutlets(userId: string) {
		const favorites = await this.prisma.favorite.findMany({
			where: { userId },
			include: {
				outlet: {
					include: {
						merchant: {
							select: {
								name: true,
								category: true,
								logoUrl: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		})

		return favorites
	}

	async isFavorite(userId: string, outletId: string): Promise<boolean> {
		const favorite = await this.prisma.favorite.findUnique({
			where: {
				userId_outletId: {
					userId,
					outletId,
				},
			},
		})

		return !!favorite
	}
}

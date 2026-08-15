import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../infra/prisma/prisma.service"
import { UpdateUserProfileDto } from "@spotly/types"

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				secondaryPhone: true,
				role: true,
				location: true,
				lat: true,
				lng: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`)
		}

		return user
	}

	async updateProfile(id: string, dto: UpdateUserProfileDto) {
		return this.prisma.user.update({
			where: { id },
			data: dto,
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				secondaryPhone: true,
				role: true,
				location: true,
				lat: true,
				lng: true,
				updatedAt: true,
			},
		})
	}
}

import { Controller, Get, Patch, Body, Param, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { UserService } from "./user.service"
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard"
import { CurrentUser } from "../../infra/auth/current-user.decorator"
import { UpdateUserProfileDto } from "@spotly/types"

@ApiTags("User")
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get current authenticated user profile" })
	async getMe(@CurrentUser("id") userId: string) {
		return this.userService.findById(userId)
	}

	@Get(":id")
	@ApiOperation({ summary: "Get user by ID" })
	async getById(@Param("id") id: string) {
		return this.userService.findById(id)
	}

	@Patch("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update current user profile" })
	async updateMe(
		@CurrentUser("id") userId: string,
		@Body() dto: UpdateUserProfileDto,
	) {
		return this.userService.updateProfile(userId, dto)
	}
}

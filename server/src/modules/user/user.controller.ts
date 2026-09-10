import { UpdateUserProfileDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { Controller, Post, Get, Patch, Body, Param, UseGuards } from "@nestjs/common"
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

  @Post("register")
  @UseGuards(JwtAuthGuard)
  async register(@CurrentUser() user: import("@supabase/supabase-js").User) {
    return this.userService.register(user);
  }

	@Patch("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update current user profile" })
	async updateMe(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(UpdateUserProfileDtoSchema)) dto: UpdateUserProfileDto,
	) {
		return this.userService.updateProfile(userId, dto)
	}
}

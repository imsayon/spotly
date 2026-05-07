import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
} from "@nestjs/common"
import { MenuService } from "./menu.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"
import {
	IsString,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsBoolean,
} from "class-validator"

class CreateCategoryDto {
	@IsString()
	@IsNotEmpty()
	name!: string
}

class UpdateCategoryDto {
	@IsString()
	@IsNotEmpty()
	name!: string
}

class CreateMenuItemDto {
	@IsString()
	@IsNotEmpty()
	name!: string

	@IsString()
	@IsOptional()
	description?: string

	@IsNumber()
	price!: number

	@IsString()
	@IsOptional()
	image?: string

	@IsBoolean()
	@IsOptional()
	isAvailable?: boolean
}

class UpdateMenuItemDto {
	@IsString()
	@IsOptional()
	name?: string

	@IsString()
	@IsOptional()
	description?: string

	@IsNumber()
	@IsOptional()
	price?: number

	@IsString()
	@IsOptional()
	image?: string

	@IsBoolean()
	@IsOptional()
	isAvailable?: boolean
}

@Controller("menu")
@UseGuards(FirebaseAuthGuard)
export class MenuController {
	constructor(private readonly menuService: MenuService) {}

	@Get(":outletId")
	async getMenu(@Param("outletId") outletId: string) {
		const data = await this.menuService.getMenu(outletId)
		return { success: true, data }
	}

	@Post(":outletId/category")
	async createCategory(
		@CurrentUser() user: DecodedUser,
		@Param("outletId") outletId: string,
		@Body() body: CreateCategoryDto,
	) {
		const data = await this.menuService.createCategory(
			user.uid,
			outletId,
			body.name,
		)
		return { success: true, data }
	}

	@Patch("category/:id")
	async updateCategory(
		@CurrentUser() user: DecodedUser,
		@Param("id") id: string,
		@Body() body: UpdateCategoryDto,
	) {
		const data = await this.menuService.updateCategory(
			user.uid,
			id,
			body.name,
		)
		return { success: true, data }
	}

	@Delete("category/:id")
	async deleteCategory(
		@CurrentUser() user: DecodedUser,
		@Param("id") id: string,
	) {
		const data = await this.menuService.deleteCategory(user.uid, id)
		return { success: true, data }
	}

	@Post("category/:categoryId/item")
	async createItem(
		@CurrentUser() user: DecodedUser,
		@Param("categoryId") categoryId: string,
		@Body() body: CreateMenuItemDto,
	) {
		const data = await this.menuService.createItem(
			user.uid,
			categoryId,
			body,
		)
		return { success: true, data }
	}

	@Patch("item/:id")
	async updateItem(
		@CurrentUser() user: DecodedUser,
		@Param("id") id: string,
		@Body() body: UpdateMenuItemDto,
	) {
		const data = await this.menuService.updateItem(user.uid, id, body)
		return { success: true, data }
	}

	@Delete("item/:id")
	async deleteItem(
		@CurrentUser() user: DecodedUser,
		@Param("id") id: string,
	) {
		const data = await this.menuService.deleteItem(user.uid, id)
		return { success: true, data }
	}
}

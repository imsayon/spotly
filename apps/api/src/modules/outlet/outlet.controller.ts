import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Delete,
	UseGuards,
} from "@nestjs/common"
import { OutletService } from "./outlet.service"
import { MerchantService } from "../merchant/merchant.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

class CreateOutletDto {
	@IsString()
	@IsNotEmpty()
	name!: string

	@IsString()
	@IsOptional()
	address?: string

	@IsNumber()
	@IsOptional()
	lat?: number

	@IsNumber()
	@IsOptional()
	lng?: number

	@IsString()
	@IsOptional()
	openTime?: string

	@IsString()
	@IsOptional()
	closeTime?: string
}

class UpdateOutletDto {
	@IsString()
	@IsOptional()
	name?: string

	@IsString()
	@IsOptional()
	address?: string

	@IsNumber()
	@IsOptional()
	lat?: number

	@IsNumber()
	@IsOptional()
	lng?: number

	@IsString()
	@IsOptional()
	openTime?: string

	@IsString()
	@IsOptional()
	closeTime?: string

	@IsOptional()
	isActive?: boolean
}

@Controller("outlet")
export class OutletController {
	constructor(
		private readonly outletService: OutletService,
		private readonly merchantService: MerchantService,
	) {}

	/** GET /api/outlet/merchant/:merchantId */
	@Get("merchant/:merchantId")
	async findByMerchant(@Param("merchantId") merchantId: string) {
		const data = await this.outletService.findByMerchant(merchantId)
		return { success: true, data }
	}

	/** GET /api/outlet/:id */
	@Get(":id")
	async findOne(@Param("id") id: string) {
		const data = await this.outletService.findById(id)
		return { success: true, data }
	}

	/** POST /api/outlet — merchant creates an outlet */
	@Post()
	@UseGuards(FirebaseAuthGuard)
	async create(
		@CurrentUser() user: DecodedUser,
		@Body() body: CreateOutletDto,
	) {
		// Ensure the authenticated user owns a merchant account
		const merchant = await this.merchantService.findByUser(user.uid)
		if (!merchant) {
			return {
				success: false,
				message: "You must register as a merchant first",
			}
		}
		const data = await this.outletService.create(
			merchant.id,
			body.name,
			body.address,
			body.lat,
			body.lng,
			body.openTime,
			body.closeTime,
		)
		return { success: true, data }
	}
	/** PATCH /api/outlet/:id — merchant updates an outlet */
	@Patch(":id")
	@UseGuards(FirebaseAuthGuard)
	async update(
		@CurrentUser() user: DecodedUser,
		@Param("id") id: string,
		@Body() body: UpdateOutletDto,
	) {
		const merchant = await this.merchantService.findByUser(user.uid)
		if (!merchant) {
			return { success: false, message: "Merchant record not found" }
		}
		const data = await this.outletService.update(
			id,
			merchant.id,
			body as Partial<{ name: string; address: string; lat: number; lng: number; openTime: string; closeTime: string; isActive: boolean }>,
		)
		return { success: true, data }
	}

	/** DELETE /api/outlet/:id — merchant deletes an outlet */
	@Delete(":id")
	@UseGuards(FirebaseAuthGuard)
	async delete(@CurrentUser() user: DecodedUser, @Param("id") id: string) {
		const merchant = await this.merchantService.findByUser(user.uid)
		if (!merchant) {
			return { success: false, message: "Merchant record not found" }
		}
		await this.outletService.delete(id, merchant.id)
		return { success: true }
	}
}

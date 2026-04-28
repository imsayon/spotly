import {
	Injectable,
	NotFoundException,
	ForbiddenException,
} from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import { Outlet } from "@spotly/database"

@Injectable()
export class OutletService {
	constructor(private readonly prisma: PrismaService) {}

	async create(
		merchantId: string,
		name: string,
		address: string = "",
		lat?: number,
		lng?: number,
		openTime?: string,
		closeTime?: string,
	): Promise<Outlet> {
		console.log(
			`[OutletService] Creating outlet "${name}" for merchant ${merchantId}`,
		)
		return this.prisma.outlet.create({
			data: {
				merchantId,
				name,
				address,
				lat,
				lng,
				openTime: openTime || "09:00",
				closeTime: closeTime || "21:00",
			},
		})
	}

	async findById(id: string): Promise<Outlet> {
		const outlet = await this.prisma.outlet.findUnique({
			where: { id },
		})
		if (!outlet) {
			throw new NotFoundException(`Outlet ${id} not found`)
		}
		return outlet
	}

	async findByMerchant(merchantId: string): Promise<Outlet[]> {
		return this.prisma.outlet.findMany({
			where: { merchantId },
		})
	}

	async update(
		id: string,
		merchantId: string,
		data: Partial<Outlet>,
	): Promise<Outlet> {
		const outlet = await this.prisma.outlet.findUnique({ where: { id } })
		if (!outlet) throw new NotFoundException("Outlet not found")
		if (outlet.merchantId !== merchantId) throw new ForbiddenException("You cannot modify another merchant's outlet")

		return this.prisma.outlet.update({
			where: { id },
			data: {
				name: data.name,
				address: data.address,
				lat: data.lat,
				lng: data.lng,
				isActive: data.isActive,
				openTime: data.openTime,
				closeTime: data.closeTime,
			},
		})
	}

	async delete(id: string, merchantId: string): Promise<void> {
		const outlet = await this.prisma.outlet.findUnique({ where: { id } })
		if (!outlet) {
			throw new NotFoundException("Outlet not found")
		}
		if (outlet.merchantId !== merchantId) {
			throw new ForbiddenException("You cannot delete another merchant's outlet")
		}

		await this.prisma.outlet.delete({
			where: { id },
		})
	}
}

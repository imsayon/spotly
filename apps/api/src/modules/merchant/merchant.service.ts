import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../prisma/prisma.service"
import { Merchant } from "@spotly/database"

// Extended merchant type with computed fields
interface MerchantWithQueueDepth extends Merchant {
	outlets?: Array<{
		id: string
		name: string
		address: string
		lat: number | null
		lng: number | null
		isActive: boolean
		merchantId: string
	}>
	currentQueueDepth: number
	distance?: number | null
}

@Injectable()
export class MerchantService {
	constructor(private readonly prisma: PrismaService) {}

	async create(
		userId: string,
		name: string,
		category: string,
	): Promise<Merchant> {
		const existing = await this.findByUser(userId)
		if (existing) {
			return existing
		}

		return this.prisma.merchant.create({
			data: {
				ownerId: userId,
				name,
				category,
			},
		})
	}

	async findById(id: string): Promise<Merchant> {
		const merchant = await this.prisma.merchant.findUnique({
			where: { id },
		})
		if (!merchant) {
			throw new NotFoundException(`Merchant ${id} not found`)
		}
		return merchant
	}

	async findAll(
		location?: string,
		search?: string,
		category?: string,
		sort?: string,
		lat?: number,
		lon?: number,
		limit?: number,
	): Promise<MerchantWithQueueDepth[]> {
		// Fetch merchants with outlets
		const merchants = await this.prisma.merchant.findMany({
			where: {
				...(category &&
					category !== "All" && {
						category: { contains: category, mode: "insensitive" },
					}),
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" } },
						{ category: { contains: search, mode: "insensitive" } },
					],
				}),
			},
			include: {
				outlets: true,
			},
		})

		// Get all outlet IDs
		const outletIds = merchants.flatMap((m) => m.outlets.map((o) => o.id))

		// Count waiting queue entries for each outlet
		const queueCounts = await this.prisma.queueEntry.groupBy({
			by: ["outletId"],
			where: {
				outletId: { in: outletIds },
				status: "WAITING",
			},
			_count: {
				outletId: true,
			},
		})

		// Create a map of outletId -> waiting count
		const countMap = new Map<string, number>()
		for (const qc of queueCounts) {
			countMap.set(qc.outletId, qc._count.outletId)
		}

		// Map the result to compute aggregate currentQueueDepth
		let mappedMerchants: MerchantWithQueueDepth[] = merchants.map(
			(merchant) => {
				const currentQueueDepth = merchant.outlets.reduce(
					(sum: number, outlet) =>
						sum + (countMap.get(outlet.id) || 0),
					0,
				)
				return { ...merchant, currentQueueDepth }
			},
		)

		// 1. Compute distances first (if lat/lon provided)
		if (lat !== undefined && lon !== undefined) {
			mappedMerchants = mappedMerchants.map((m) => {
				const distances =
					m.outlets?.map((o) => {
						if (o.lat === null || o.lng === null) return Infinity
						const dx = (o.lat - lat) * 111
						const dy =
							(o.lng - lon) *
							111 *
							Math.cos((lat * Math.PI) / 180)
						return Math.sqrt(dx * dx + dy * dy)
					}) || [Infinity]
				const nearestDistance = Math.min(...distances)
				return {
					...m,
					distance:
						nearestDistance === Infinity ? null : nearestDistance,
				}
			})
		}

		// 2. Apply sorting
		if (sort === "queue_asc") {
			mappedMerchants.sort(
				(a, b) => a.currentQueueDepth - b.currentQueueDepth,
			)
		} else if (lat !== undefined && lon !== undefined) {
			// Default sort by distance if lat/lon provided and no other sort specified
			mappedMerchants.sort(
				(a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
			)
		}

		if (limit && limit > 0) {
			mappedMerchants = mappedMerchants.slice(0, limit)
		}

		return mappedMerchants
	}

	async findByUser(userId: string): Promise<Merchant | null> {
		return this.prisma.merchant.findUnique({
			where: { ownerId: userId },
		})
	}

	async updateProfile(
		userId: string,
		data: Partial<Merchant>,
	): Promise<Merchant> {
		const merchant = await this.findByUser(userId)
		if (!merchant) {
			throw new NotFoundException("Merchant profile not found")
		}

		return this.prisma.merchant.update({
			where: { id: merchant.id },
			data: {
				name: data.name,
				category: data.category,
				description: data.description,
				phone: data.phone,
				contactEmail: data.contactEmail,
				logoUrl: data.logoUrl,
			},
		})
	}
}

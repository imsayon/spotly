import { BadRequestException, Injectable } from "@nestjs/common"
import { QueueRepository } from "../interfaces/queue-repository.interface"
import { PrismaService } from "../../../prisma/prisma.service"
import { QueueEntry as PrismaQueueEntry } from "@spotly/database"

// A mapping type since `@spotly/types` QueueEntry might differ slightly from Prisma's QueueEntry
import { QueueEntry, QueueStatus } from "@spotly/types"

@Injectable()
export class PrismaQueueRepository implements QueueRepository {
	constructor(private readonly prisma: PrismaService) {}

	private mapToDomain(entry: PrismaQueueEntry): QueueEntry {
		return {
			id: entry.id,
			userId: entry.userId,
			outletId: entry.outletId,
			tokenNumber: entry.tokenNumber,
			status: entry.status as QueueStatus,
			joinedAt: entry.createdAt.toISOString(),
		}
	}

	async joinQueue(
		data: Omit<QueueEntry, "id" | "tokenNumber">,
	): Promise<QueueEntry> {
		return this.prisma.$transaction(async (tx) => {
			await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          ('x' || left(md5(${data.userId}), 8))::bit(32)::int,
          ('x' || right(md5(${data.userId}), 8))::bit(32)::int
        )
      `

			const existing = await tx.queueEntry.findFirst({
				where: {
					userId: data.userId,
					status: { in: ["PENDING_ACCEPTANCE", "WAITING", "CALLED"] },
				},
				orderBy: { createdAt: "desc" },
			})
			if (existing) {
				if (existing.outletId === data.outletId)
					return this.mapToDomain(existing)
				const err = new Error("DUPLICATE_ACTIVE_ENTRY")
				;(err as Error & { outletId?: string }).outletId =
					existing.outletId
				throw err
			}

			// Atomic increment — upsert the daily counter row, increment, return new value.
			const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
			const result = await tx.$queryRaw<Array<{ counter: number }>>`
        INSERT INTO "OutletDailyCounter" ("outletId", date, counter)
        VALUES (${data.outletId}, ${today}::date, 1)
        ON CONFLICT ("outletId", date)
        DO UPDATE SET counter = "OutletDailyCounter".counter + 1
        RETURNING counter::int
      `

			const tokenNumber = result?.[0]?.counter
			if (!Number.isFinite(tokenNumber) || tokenNumber <= 0) {
				throw new Error(`Invalid token number: ${tokenNumber}`)
			}

			const created = await tx.queueEntry.create({
				data: {
					userId: data.userId,
					outletId: data.outletId,
					tokenNumber,
					status: data.status,
				},
			})

			return this.mapToDomain(created)
		})
	}

	async isOutletOpen(outletId: string): Promise<boolean> {
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
			select: { isActive: true, openTime: true, closeTime: true },
		})
		if (!outlet?.isActive) return false
		if (!outlet.openTime || !outlet.closeTime) return true

		const [openH, openM] = outlet.openTime.split(":").map(Number)
		const [closeH, closeM] = outlet.closeTime.split(":").map(Number)
		if (![openH, openM, closeH, closeM].every(Number.isFinite)) return true

		// TODO: Add timezone column to Outlet schema. Defaulting to Asia/Kolkata (IST) for now.
		const now = new Date()
		const nowInIST = new Date(
			now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
		)
		const nowMinutes = nowInIST.getHours() * 60 + nowInIST.getMinutes()
		const openMinutes = openH * 60 + openM
		const closeMinutes = closeH * 60 + closeM

		if (openMinutes <= closeMinutes) {
			return nowMinutes >= openMinutes && nowMinutes < closeMinutes
		}
		return nowMinutes >= openMinutes || nowMinutes < closeMinutes
	}

	async findActiveEntryForUser(userId: string): Promise<QueueEntry | null> {
		const entry = await this.prisma.queueEntry.findFirst({
			where: {
				userId,
				status: { in: ["PENDING_ACCEPTANCE", "WAITING", "CALLED"] },
			},
			orderBy: { createdAt: "desc" },
		})
		return entry ? this.mapToDomain(entry) : null
	}

	async getQueue(outletId: string): Promise<QueueEntry[]> {
		const entries = await this.prisma.queueEntry.findMany({
			where: {
				outletId,
				status: { in: ["PENDING_ACCEPTANCE", "WAITING", "CALLED"] },
			},
			orderBy: { tokenNumber: "asc" },
		})
		return entries.map((e) => this.mapToDomain(e))
	}

	async getEntry(entryId: string): Promise<QueueEntry | null> {
		const entry = await this.prisma.queueEntry.findUnique({
			where: { id: entryId },
		})
		return entry ? this.mapToDomain(entry) : null
	}

	async advanceQueue(outletId: string): Promise<QueueEntry | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "QueueEntry"
        WHERE "outletId" = ${outletId} AND status = 'CALLED'
        LIMIT 1
        FOR UPDATE
      `
			if (existing.length > 0) {
				throw new BadRequestException(
					"Mark the current token as served or missed before calling next",
				)
			}

			const claimed = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "QueueEntry"
        SET status = 'CALLED', "updatedAt" = NOW()
        WHERE id = (
          SELECT id FROM "QueueEntry"
          WHERE "outletId" = ${outletId} AND status = 'WAITING'
          ORDER BY "tokenNumber" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `
			if (claimed.length === 0) return null

			const updated = await tx.queueEntry.findUnique({
				where: { id: claimed[0].id },
			})
			return updated ? this.mapToDomain(updated) : null
		})
	}

	async markMissed(entryId: string): Promise<void> {
		const result = await this.prisma.queueEntry.updateMany({
			where: { id: entryId, status: "CALLED" },
			data: { status: "MISSED" },
		})
		if (result.count === 0) {
			throw new BadRequestException(
				"Entry must be in CALLED state before marking missed",
			)
		}
	}

	async markServed(entryId: string): Promise<void> {
		const result = await this.prisma.queueEntry.updateMany({
			where: { id: entryId, status: "CALLED" },
			data: { status: "SERVED" },
		})
		if (result.count === 0) {
			throw new BadRequestException(
				"Entry must be in CALLED state before marking served",
			)
		}
	}

	async leaveQueue(entryId: string): Promise<void> {
		const result = await this.prisma.queueEntry.updateMany({
			where: {
				id: entryId,
				status: { in: ["PENDING_ACCEPTANCE", "WAITING"] },
			},
			data: { status: "CANCELLED" },
		})
		if (result.count === 0) {
			throw new BadRequestException(
				"Only PENDING_ACCEPTANCE or WAITING entries can be cancelled",
			)
		}
	}

	async countWaiting(outletId: string): Promise<number> {
		return this.prisma.queueEntry.count({
			where: { outletId, status: "WAITING" },
		})
	}

	async acceptEntry(entryId: string): Promise<void> {
		const result = await this.prisma.queueEntry.updateMany({
			where: { id: entryId, status: "PENDING_ACCEPTANCE" },
			data: { status: "WAITING" },
		})
		if (result.count === 0) {
			throw new BadRequestException(
				"Entry must be in PENDING_ACCEPTANCE state to accept",
			)
		}
	}

	/**
	 * Merchant rejects a PENDING_ACCEPTANCE or WAITING entry.
	 * Unlike `markMissed` (which requires CALLED state for no-shows),
	 * this allows merchants to proactively remove entries before they are called.
	 */
	async rejectEntry(entryId: string): Promise<void> {
		const result = await this.prisma.queueEntry.updateMany({
			where: {
				id: entryId,
				status: { in: ["PENDING_ACCEPTANCE", "WAITING"] },
			},
			data: { status: "MISSED" },
		})
		if (result.count === 0) {
			throw new BadRequestException(
				"Entry must be in PENDING_ACCEPTANCE or WAITING state to reject",
			)
		}
	}

	/**
	 * Get past queue entries for a user (SERVED + CANCELLED).
	 * Includes outlet info for display in consumer profile.
	 */
	async getHistory(userId: string, limit = 20): Promise<QueueEntry[]> {
		const entries = await this.prisma.queueEntry.findMany({
			where: {
				userId,
				status: { in: ["SERVED", "CANCELLED", "MISSED"] },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
			include: {
				outlet: {
					select: {
						name: true,
						merchant: {
							select: { name: true, category: true },
						},
					},
				},
			},
		})
		return entries.map((e) => {
			const entry = e as PrismaQueueEntry & {
				outlet?: {
					name: string
					merchant?: { name: string; category: string }
				}
			}
			return {
				...this.mapToDomain(e),
				outletName: entry.outlet?.name,
				merchantName: entry.outlet?.merchant?.name,
				merchantCategory: entry.outlet?.merchant?.category,
			}
		})
	}

	async getOutletHistory(
		outletId: string,
		from: Date,
		to: Date,
	): Promise<QueueEntry[]> {
		const entries = await this.prisma.queueEntry.findMany({
			where: {
				outletId,
				createdAt: { gte: from, lte: to },
			},
			orderBy: { tokenNumber: "asc" },
		})
		return entries.map((e) => this.mapToDomain(e))
	}

	async cleanupStalePending(cutoff: Date): Promise<QueueEntry[]> {
		return this.prisma.$transaction(async (tx) => {
			const stale = await tx.queueEntry.findMany({
				where: {
					status: "PENDING_ACCEPTANCE",
					createdAt: { lt: cutoff },
				},
			})
			if (stale.length === 0) return []

			await tx.queueEntry.updateMany({
				where: { id: { in: stale.map((entry) => entry.id) } },
				data: { status: "MISSED" },
			})

			return stale.map((entry) =>
				this.mapToDomain({ ...entry, status: "MISSED" }),
			)
		})
	}
}

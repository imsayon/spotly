import { Inject, Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import {
	QueueRepository,
	QUEUE_REPOSITORY,
} from "./interfaces/queue-repository.interface"
import {
	QueueEntry,
	QueueUpdatePayload,
	TokenCalledPayload,
} from "@spotly/types"
import { QueueGateway } from "../websocket/queue.gateway"

// In-memory store for calledAt timestamps (will be replaced with Redis/DB in production)
interface CalledAtRecord {
	calledAt: Date
	outletId: string
}

@Injectable()
export class QueueService {
	// Track when each entry was called (entryId -> calledAt info)
	private calledAtStore = new Map<string, CalledAtRecord>()

	constructor(
		@Inject(QUEUE_REPOSITORY)
		private readonly repo: QueueRepository,
		private readonly gateway: QueueGateway,
	) {}

	/**
	 * Consumer joins a queue.
	 */
	async joinQueue(userId: string, outletId: string): Promise<QueueEntry> {
		// Guard: prevent joining a queue you're already in
		const existing = await this.repo.getQueue(outletId)
		const alreadyIn = existing.find(
			(e) => e.userId === userId && (e.status === "WAITING" || e.status === "CALLED"),
		)
		if (alreadyIn) {
			throw new ConflictException("You are already in this queue")
		}

		const entry = await this.repo.joinQueue({
			userId,
			outletId,
			tokenNumber: 0, // repo ignores this and computes it atomically
			status: "WAITING",
			joinedAt: new Date().toISOString(),
		})

		await this.emitQueueUpdate(outletId)
		return entry
	}

	/**
	 * Get full queue for an outlet (WAITING + CALLED entries) with avg wait time.
	 */
	async getQueue(
		outletId: string,
	): Promise<{ entries: QueueEntry[]; avgWaitPerPerson: number }> {
		const [entries, outlet] = await Promise.all([
			this.repo.getQueue(outletId),
			this.repo.getOutlet(outletId),
		])

		const avgWaitPerPerson = outlet?.avgServeTimeSeconds ?? 300 // default 5 minutes

		return { entries, avgWaitPerPerson }
	}

	/**
	 * Get a single queue entry by ID.
	 */
	async getEntry(entryId: string): Promise<QueueEntry> {
		const entry = await this.repo.getEntry(entryId)
		if (!entry)
			throw new NotFoundException(`Queue entry ${entryId} not found`)
		return entry
	}

	/**
	 * Merchant advances the queue — marks next WAITING entry as CALLED.
	 */
	async advanceQueue(outletId: string): Promise<QueueEntry | null> {
		const called = await this.repo.advanceQueue(outletId)

		if (called) {
			// Track when this entry was called for serve time calculation
			this.calledAtStore.set(called.id, {
				calledAt: new Date(),
				outletId,
			})

			// Emit token_called event first so consumer UI responds immediately
			const payload: TokenCalledPayload = {
				outletId,
				tokenNumber: called.tokenNumber,
				userId: called.userId,
			}
			await this.gateway.emitTokenCalled(outletId, payload)

			// Then emit general queue update
			await this.emitQueueUpdate(outletId)
		}

		return called
	}

	/**
	 * Consumer leaves the queue voluntarily.
	 */
	async leaveQueue(entryId: string, userId: string): Promise<void> {
		const entry = await this.repo.getEntry(entryId)
		if (!entry)
			throw new NotFoundException(`Queue entry ${entryId} not found`)
		if (entry.userId !== userId) {
			throw new NotFoundException(
				"You can only leave your own queue entry",
			)
		}

		const { outletId } = entry
		await this.repo.leaveQueue(entryId)
		await this.emitQueueUpdate(outletId)
	}

	/**
	 * Mark entry as SERVED (called by merchant after serving).
	 * Calculates serve duration and updates outlet's average.
	 */
	async markServed(entryId: string, outletId: string): Promise<void> {
		const calledRecord = this.calledAtStore.get(entryId)
		const servedAt = new Date()

		// Default to 5 minutes if no record found
		let durationSeconds = 300
		let calledAt = new Date(servedAt.getTime() - durationSeconds * 1000)

		if (calledRecord) {
			calledAt = calledRecord.calledAt
			durationSeconds = Math.floor(
				(servedAt.getTime() - calledAt.getTime()) / 1000,
			)
			// Clean up the store
			this.calledAtStore.delete(entryId)
		}

		await this.repo.markServed(
			entryId,
			outletId,
			calledAt,
			servedAt,
			durationSeconds,
		)
		await this.emitQueueUpdate(outletId)
	}

	/**
	 * Mark entry as MISSED (called by merchant if customer doesn't respond to call).
	 */
	async markMissed(entryId: string, outletId: string): Promise<void> {
		await this.repo.markMissed(entryId)
		await this.emitQueueUpdate(outletId)
	}

	/**
	 * Get queue history for a user (SERVED or CANCELLED status).
	 */
	async getHistory(userId: string) {
		return this.repo.getHistory(userId)
	}

	// ─── Private ───────────────────────────────────────────────────────────────

	private async emitQueueUpdate(outletId: string): Promise<void> {
		const entries = await this.repo.getQueue(outletId)
		const currentCalled = entries.find((e) => e.status === "CALLED")
		const payload: QueueUpdatePayload = {
			outletId,
			entries,
			currentToken: currentCalled?.tokenNumber ?? 0,
		}
		await this.gateway.emitQueueUpdate(outletId, payload)
	}
}

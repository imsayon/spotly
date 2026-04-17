import { QueueEntry } from "@spotly/types"

/**
 * QueueRepository — abstract interface.
 *
 * This is the ONLY contract the QueueService depends on.
 * Swap implementations (Firestore → Prisma) by changing the provider
 * in queue.module.ts — zero service rewrites needed.
 */
export interface QueueRepository {
	/** Add a new entry to the queue */
	joinQueue(data: Omit<QueueEntry, "id">): Promise<QueueEntry>

	/** Get all entries for an outlet (ordered by tokenNumber) */
	getQueue(outletId: string): Promise<QueueEntry[]>

	/** Get a single entry by ID */
	getEntry(entryId: string): Promise<QueueEntry | null>

	/** Mark the next WAITING entry as CALLED */
	advanceQueue(outletId: string): Promise<QueueEntry | null>

	/** Mark an entry as MISSED */
	markMissed(entryId: string): Promise<void>

	/** Mark an entry as SERVED and record serve duration */
	markServed(
		entryId: string,
		outletId: string,
		calledAt: Date,
		servedAt: Date,
		durationSeconds: number,
	): Promise<void>

	/** Remove an entry (consumer leaves queue) */
	leaveQueue(entryId: string): Promise<void>

	/** Count WAITING entries for an outlet */
	countWaiting(outletId: string): Promise<number>

	/** Get queue history for a user */
	getHistory(userId: string): Promise<QueueEntry[]>

	/** Get outlet with avgServeTimeSeconds */
	getOutlet(
		outletId: string,
	): Promise<{ id: string; name: string; avgServeTimeSeconds: number } | null>

	/** Find an active (WAITING or CALLED) entry for a user at an outlet */
	findActiveEntryByUserAndOutlet(
		userId: string,
		outletId: string,
	): Promise<QueueEntry | null>
}

export const QUEUE_REPOSITORY = "QUEUE_REPOSITORY"

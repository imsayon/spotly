import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QueueRepository, QUEUE_REPOSITORY } from './interfaces/queue-repository.interface';
import { QueueEntry, QueueUpdatePayload, TokenCalledPayload } from '@spotly/types';
import { QueueGateway } from '../websocket/queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    @Inject(QUEUE_REPOSITORY)
    private readonly repo: QueueRepository,
    private readonly gateway: QueueGateway,
  ) {}

  /**
   * Consumer joins a queue.
   * Token number is assigned atomically via repository.
   * Duplicate join guard prevents double-tapping.
   */
  async joinQueue(userId: string, outletId: string): Promise<QueueEntry> {
    const isOpen = await this.repo.isOutletOpen(outletId);
    if (!isOpen) {
      throw new BadRequestException('This outlet is not accepting queue entries right now');
    }

    // Duplicate guard — check for existing active entry for this user at ANY outlet
    const existingEntry = await this.repo.findActiveEntryForUser(userId);
    if (existingEntry) {
      if (existingEntry.outletId === outletId) return existingEntry;
      throw new ConflictException('You already have an active queue entry at another outlet');
    }

    // Atomic token assignment and queue insertion combined into a single DB lock
    const entry = await this.repo.joinQueue({
      userId,
      outletId,
      status: 'PENDING_ACCEPTANCE',
      joinedAt: new Date().toISOString(),
    });

    // Emit live update to all clients in this outlet's room
    await this.emitQueueUpdate(outletId);

    return entry;
  }

  /**
   * Get full queue for an outlet (WAITING + CALLED entries).
   */
  async getQueue(outletId: string): Promise<QueueEntry[]> {
    return this.repo.getQueue(outletId);
  }

  /**
   * Get a single queue entry by ID.
   */
  async getEntry(entryId: string): Promise<QueueEntry> {
    const entry = await this.repo.getEntry(entryId);
    if (!entry) throw new NotFoundException(`Queue entry ${entryId} not found`);
    return entry;
  }

  /**
   * Get the user's current active queue entry (if any).
   */
  async getActiveEntry(userId: string): Promise<QueueEntry | null> {
    return this.repo.findActiveEntryForUser(userId);
  }

  /**
   * Get past queue entries for a user (SERVED + CANCELLED).
   */
  async getHistory(userId: string, limit = 20): Promise<QueueEntry[]> {
    return this.repo.getHistory(userId, limit);
  }

  /**
   * Merchant advances the queue — marks next WAITING entry as CALLED.
   */
  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    const queue = await this.repo.getQueue(outletId);
    if (queue.find(e => e.status === 'CALLED')) {
      throw new BadRequestException('Mark the current token as served or missed before calling next');
    }

    const called = await this.repo.advanceQueue(outletId);

    if (called) {
      // Emit token_called event first so consumer UI responds immediately
      // NOTE: We strip userId from the broadcast to avoid PII leakage over unauthenticated WS.
      // Consumer clients match against their own local entry state instead.
      const payload: Omit<TokenCalledPayload, 'userId'> & { userId?: string } = {
        outletId,
        tokenNumber: called.tokenNumber,
        // userId intentionally omitted from broadcast
      };
      await this.gateway.emitTokenCalled(outletId, payload as TokenCalledPayload);

      // Then emit general queue update
      await this.emitQueueUpdate(outletId);
    }

    return called;
  }

  /**
   * Consumer leaves the queue voluntarily.
   */
  async leaveQueue(entryId: string, userId: string): Promise<void> {
    const entry = await this.repo.getEntry(entryId);
    if (!entry) throw new NotFoundException(`Queue entry ${entryId} not found`);
    if (entry.userId !== userId) {
      throw new BadRequestException('You can only leave your own queue entry');
    }

    const { outletId } = entry;
    await this.repo.leaveQueue(entryId);
    await this.gateway.emitEntryUpdate(outletId, { entryId, status: 'CANCELLED' });
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Mark entry as SERVED (called by merchant after serving).
   */
  async markServed(entryId: string, outletId: string): Promise<void> {
    await this.repo.markServed(entryId);
    await this.gateway.emitEntryUpdate(outletId, { entryId, status: 'SERVED' });
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Mark entry as MISSED (called by merchant if customer doesn't respond to call)
   */
  async markMissed(entryId: string, outletId: string): Promise<void> {
    await this.repo.markMissed(entryId);
    await this.gateway.emitEntryUpdate(outletId, { entryId, status: 'MISSED' });
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Merchant accepts a PENDING_ACCEPTANCE entry — moves it to WAITING.
   */
  async acceptEntry(entryId: string, outletId: string): Promise<void> {
    const entry = await this.repo.getEntry(entryId);
    if (!entry) throw new NotFoundException(`Queue entry ${entryId} not found`);
    // Move from PENDING_ACCEPTANCE → WAITING
    await this.repo.acceptEntry(entryId);
    await this.emitQueueUpdate(outletId);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async emitQueueUpdate(outletId: string): Promise<void> {
    const entries = await this.repo.getQueue(outletId);
    const currentCalled = entries.find((e) => e.status === 'CALLED');

    // Strip userId from broadcast to prevent PII leakage over unauthenticated WS.
    // Merchant dashboard re-fetches full queue via authenticated REST API.
    const sanitizedEntries = entries.map(({ userId, ...rest }) => rest);

    const payload: QueueUpdatePayload = {
      outletId,
      entries: sanitizedEntries as QueueEntry[],
      currentToken: currentCalled?.tokenNumber ?? 0,
    };
    await this.gateway.emitQueueUpdate(outletId, payload);
  }
}

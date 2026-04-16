import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
   * Token number = current waiting count + 1 (temporary — replace with Redis INCR later).
   */
  async joinQueue(userId: string, outletId: string): Promise<QueueEntry> {
    const waiting = await this.repo.countWaiting(outletId);
    const tokenNumber = waiting + 1;

    const entry = await this.repo.joinQueue({
      userId,
      outletId,
      tokenNumber,
      status: 'WAITING',
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
   * Merchant advances the queue — marks next WAITING entry as CALLED.
   */
  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    const called = await this.repo.advanceQueue(outletId);

    if (called) {
      // Emit token_called event first so consumer UI responds immediately
      const payload: TokenCalledPayload = {
        outletId,
        tokenNumber: called.tokenNumber,
        userId: called.userId,
      };
      await this.gateway.emitTokenCalled(outletId, payload);

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
      throw new NotFoundException('You can only leave your own queue entry');
    }

    const { outletId } = entry;
    await this.repo.leaveQueue(entryId);
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Mark entry as SERVED (called by merchant after serving).
   */
  async markServed(entryId: string, outletId: string): Promise<void> {
    await this.repo.markServed(entryId);
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Mark entry as MISSED (called by merchant if customer doesn't respond to call).
   */
  async markMissed(entryId: string, outletId: string): Promise<void> {
    await this.repo.markMissed(entryId);
    await this.emitQueueUpdate(outletId);
  }

  /**
   * Get queue history for a user (SERVED or CANCELLED status).
   */
  async getHistory(userId: string) {
    return this.repo.getHistory(userId);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async emitQueueUpdate(outletId: string): Promise<void> {
    const entries = await this.repo.getQueue(outletId);
    const currentCalled = entries.find((e) => e.status === 'CALLED');
    const payload: QueueUpdatePayload = {
      outletId,
      entries,
      currentToken: currentCalled?.tokenNumber ?? 0,
    };
    await this.gateway.emitQueueUpdate(outletId, payload);
  }
}

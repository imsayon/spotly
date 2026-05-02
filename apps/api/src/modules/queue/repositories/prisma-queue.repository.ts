import { Injectable } from '@nestjs/common';
import { QueueRepository } from '../interfaces/queue-repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueEntry as PrismaQueueEntry } from '@spotly/database';

// A mapping type since `@spotly/types` QueueEntry might differ slightly from Prisma's QueueEntry
import { QueueEntry, QueueStatus } from '@spotly/types';

@Injectable()
export class PrismaQueueRepository implements QueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(entry: PrismaQueueEntry): QueueEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      outletId: entry.outletId,
      tokenNumber: entry.tokenNumber ?? 0,
      status: entry.status as QueueStatus,
      joinedAt: entry.createdAt.toISOString(),
    };
  }

  async joinQueue(data: Omit<QueueEntry, 'id'>): Promise<QueueEntry> {
    const created = await this.prisma.queueEntry.create({
      data: {
        userId: data.userId,
        outletId: data.outletId,
        tokenNumber: data.tokenNumber,
        status: data.status,
      },
    });
    return this.mapToDomain(created);
  }

  async isOutletOpen(outletId: string): Promise<boolean> {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      select: { isActive: true },
    });
    return Boolean(outlet?.isActive);
  }

  async findActiveEntryForUser(userId: string): Promise<QueueEntry | null> {
    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        status: { in: ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return entry ? this.mapToDomain(entry) : null;
  }

  /**
   * Atomic token number assignment using Prisma $transaction.
   * This prevents the race condition where two concurrent joins both read
   * the same count and assign the same token number.
   */
  async getNextTokenNumber(outletId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the outlet row to prevent concurrent transactions from reading the same _max
      await tx.$executeRaw`SELECT id FROM "Outlet" WHERE id = ${outletId} FOR UPDATE`;

      // 2. Now safe to aggregate
      const aggregate = await tx.queueEntry.aggregate({
        where: { outletId },
        _max: { tokenNumber: true },
      });
      return (aggregate._max.tokenNumber ?? 0) + 1;
    });
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        outletId,
        status: { in: ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'] },
      },
      orderBy: { tokenNumber: 'asc' },
    });
    return entries.map((e) => this.mapToDomain(e));
  }

  async getEntry(entryId: string): Promise<QueueEntry | null> {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
    });
    return entry ? this.mapToDomain(entry) : null;
  }

  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    // 1. Find the first WAITING entry
    const nextWaiting = await this.prisma.queueEntry.findFirst({
      where: { outletId, status: 'WAITING' },
      orderBy: { tokenNumber: 'asc' },
    });

    if (!nextWaiting) return null;

    // 2. Mark it as CALLED
    const updated = await this.prisma.queueEntry.update({
      where: { id: nextWaiting.id },
      data: { status: 'CALLED' },
    });

    return this.mapToDomain(updated);
  }

  async markMissed(entryId: string): Promise<void> {
    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'MISSED' },
    });
  }

  async markServed(entryId: string): Promise<void> {
    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'SERVED' },
    });
  }

  async leaveQueue(entryId: string): Promise<void> {
    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED' },
    });
  }

  async countWaiting(outletId: string): Promise<number> {
    return this.prisma.queueEntry.count({
      where: { outletId, status: 'WAITING' },
    });
  }

  async acceptEntry(entryId: string): Promise<void> {
    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'WAITING' },
    });
  }

  /**
   * Get past queue entries for a user (SERVED + CANCELLED).
   * Includes outlet info for display in consumer profile.
   */
  async getHistory(userId: string, limit = 20): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        userId,
        status: { in: ['SERVED', 'CANCELLED', 'MISSED'] },
      },
      orderBy: { createdAt: 'desc' },
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
    });
    return entries.map((e) => {
      const entry = e as PrismaQueueEntry & {
        outlet?: { name: string; merchant?: { name: string; category: string } };
      };
      return {
        ...this.mapToDomain(e),
        outletName: entry.outlet?.name,
        merchantName: entry.outlet?.merchant?.name,
        merchantCategory: entry.outlet?.merchant?.category,
      };
    });
  }
}

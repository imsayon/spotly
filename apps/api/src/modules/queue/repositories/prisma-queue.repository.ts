import { Injectable } from '@nestjs/common';
import { QueueRepository } from '../interfaces/queue-repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueEntry as PrismaQueueEntry } from '@spotly/database';

// A mapping type since `@spotly/types` QueueEntry might differ slightly from Prisma's QueueEntry
// Let's coerce it to match the interface needed by the Queue Service
import { QueueEntry } from '@spotly/types';

@Injectable()
export class PrismaQueueRepository implements QueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(entry: PrismaQueueEntry): QueueEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      outletId: entry.outletId,
      tokenNumber: entry.tokenNumber,
      // Map Prisma enum to the domain union type string
      status: entry.status === 'CANCELLED' ? 'MISSED' : (entry.status as any),
      joinedAt: entry.createdAt.toISOString(),
    };
  }

  async joinQueue(data: Omit<QueueEntry, 'id'>): Promise<QueueEntry> {
    const created = await this.prisma.queueEntry.create({
      data: {
        userId: data.userId,
        outletId: data.outletId,
        tokenNumber: data.tokenNumber,
        status: 'PENDING_ACCEPTANCE',
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

  async getNextTokenNumber(outletId: string): Promise<number> {
    const aggregate = await this.prisma.queueEntry.aggregate({
      where: { outletId },
      _max: { tokenNumber: true },
    });
    return (aggregate._max.tokenNumber ?? 0) + 1;
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        outletId,
        status: { in: ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'] },
      },
      orderBy: { tokenNumber: 'asc' },
    });
    return entries.map(this.mapToDomain);
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
      data: { status: 'CANCELLED' },
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
}

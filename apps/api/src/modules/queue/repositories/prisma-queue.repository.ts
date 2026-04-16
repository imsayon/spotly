import { Injectable } from '@nestjs/common';
import { QueueRepository } from '../interfaces/queue-repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueEntry as PrismaQueueEntry, QueueStatus } from '@spotly/database';

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
      tokenNumber: entry.token,
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
        token: data.tokenNumber,
        status: 'WAITING',
      },
    });
    return this.mapToDomain(created);
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        outletId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      orderBy: { token: 'asc' },
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
      orderBy: { token: 'asc' },
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

  async getHistory(userId: string): Promise<any[]> {
    return this.prisma.queueEntry.findMany({
      where: {
        userId,
        status: { in: ['SERVED', 'CANCELLED'] },
      },
      include: {
        outlet: {
          include: {
            merchant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

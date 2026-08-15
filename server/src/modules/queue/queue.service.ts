import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AppEventsService } from "../../shared/events/app-events.service";
import { QueueEntry, QueueUpdatePayload } from "@spotly/types";

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appEvents: AppEventsService,
  ) {}

  async joinQueue(userId: string, outletId: string): Promise<QueueEntry> {
    const outlet = await this.prisma.outlet.findUnique({ where: { id: outletId } });
    if (!outlet || !outlet.isActive) {
      throw new BadRequestException("This outlet is not accepting queue entries right now");
    }

    // Single active queue constraint check
    const existingActive = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        status: { in: ["WAITING", "CALLED", "PENDING_ACCEPTANCE"] },
      },
    });

    if (existingActive) {
      throw new ConflictException("You already have an active queue entry at another outlet");
    }

    const todayStr = new Date().toISOString().split("T")[0]!;
    const today = new Date(todayStr);

    // Atomic transaction for counter increment and queue entry creation
    const entry = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const counterRecord = await tx.outletDailyCounter.upsert({
        where: { outletId_date: { outletId, date: today } },
        update: { counter: { increment: 1 } },
        create: { outletId, date: today, counter: 1 },
      });

      return tx.queueEntry.create({
        data: {
          userId,
          outletId,
          tokenNumber: counterRecord.counter,
          status: "PENDING_ACCEPTANCE",
        },
      });
    });

    await this.emitQueueUpdate(outletId);
    return entry as QueueEntry;
  }

  async getQueue(outletId: string): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        outletId,
        status: { in: ["WAITING", "CALLED", "PENDING_ACCEPTANCE"] },
      },
      orderBy: { tokenNumber: "asc" },
    });
    return entries as QueueEntry[];
  }

  async getEntry(entryId: string): Promise<QueueEntry> {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException(`Queue entry ${entryId} not found`);
    return entry as QueueEntry;
  }

  async getActiveEntry(userId: string): Promise<QueueEntry | null> {
    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        status: { in: ["WAITING", "CALLED", "PENDING_ACCEPTANCE"] },
      },
      include: { outlet: true },
    });
    return entry as QueueEntry | null;
  }

  async getHistory(userId: string, limit = 20): Promise<QueueEntry[]> {
    const entries = await this.prisma.queueEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { outlet: true },
    });
    return entries as QueueEntry[];
  }

  async advanceQueue(outletId: string): Promise<QueueEntry | null> {
    const nextEntry = await this.prisma.queueEntry.findFirst({
      where: { outletId, status: "WAITING" },
      orderBy: { tokenNumber: "asc" },
    });

    if (!nextEntry) return null;

    const updated = await this.prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: { status: "CALLED", calledAt: new Date() },
    });

    this.appEvents.emit("token:called", {
      outletId,
      payload: { outletId, tokenNumber: updated.tokenNumber },
    });

    await this.emitQueueUpdate(outletId);
    return updated as QueueEntry;
  }

  async leaveQueue(entryId: string, userId: string): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (entry.userId !== userId) {
      throw new BadRequestException("You can only leave your own queue entry");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "CANCELLED" },
    });

    await this.emitQueueUpdate(entry.outletId);
  }

  async markServed(entryId: string, outletId: string): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (entry.outletId !== outletId) {
      throw new ForbiddenException("Entry does not belong to this outlet");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "SERVED", servedAt: new Date() },
    });

    await this.emitQueueUpdate(outletId);
  }

  async markMissed(entryId: string, outletId: string): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (entry.outletId !== outletId) {
      throw new ForbiddenException("Entry does not belong to this outlet");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "MISSED" },
    });

    await this.emitQueueUpdate(outletId);
  }

  async acceptEntry(entryId: string, outletId: string): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (entry.outletId !== outletId) {
      throw new ForbiddenException("Entry does not belong to this outlet");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "WAITING" },
    });

    await this.emitQueueUpdate(outletId);
  }

  async rejectEntry(entryId: string, outletId: string): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (entry.outletId !== outletId) {
      throw new ForbiddenException("Entry does not belong to this outlet");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "MISSED" },
    });

    await this.emitQueueUpdate(outletId);
  }

  async cleanupStalePendingEntries(): Promise<void> {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const stale = await this.prisma.queueEntry.findMany({
      where: { status: "PENDING_ACCEPTANCE", createdAt: { lt: cutoff } },
    });

    if (stale.length === 0) return;

    await this.prisma.queueEntry.updateMany({
      where: { status: "PENDING_ACCEPTANCE", createdAt: { lt: cutoff } },
      data: { status: "MISSED" },
    });

    const uniqueOutletIds: string[] = Array.from(new Set(stale.map((s: { outletId: string }) => s.outletId)));
    for (const outletId of uniqueOutletIds) {
      await this.emitQueueUpdate(outletId);
    }
  }

  private async emitQueueUpdate(outletId: string): Promise<void> {
    const entries = await this.getQueue(outletId);
    const currentCalled = entries.find((e) => e.status === "CALLED");

    const sanitized = entries.map(({ userId: _userId, ...rest }) => rest);

    const payload: QueueUpdatePayload = {
      outletId,
      entries: sanitized as QueueEntry[],
      currentToken: currentCalled?.tokenNumber ?? 0,
    };

    this.appEvents.emit("queue:update", { outletId, payload });
  }
}

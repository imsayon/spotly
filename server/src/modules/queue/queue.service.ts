import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma, QueueStatus } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AppEventsService } from "../../shared/events/app-events.service";
import { QueueUpdatePayload } from "@spotly/types";

const active: QueueStatus[] = ["PENDING_ACCEPTANCE", "WAITING", "CALLED"];
const pendingCutoff = () => new Date(Date.now() - 10 * 60 * 1000);

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService, private readonly appEvents: AppEventsService) {}

  private async transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(work, { isolationLevel: "Serializable" });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2034" && attempt < 3) continue;
          if (["P2002", "P2034"].includes(error.code)) {
            throw new ConflictException("The queue changed. Refresh and try again.");
          }
        }
        throw error;
      }
    }
  }

  async joinQueue(userId: string, outletId: string) {
    await this.cleanupStalePendingEntries();
    const entry = await this.transaction(async (tx) => {
      const outlet = await tx.outlet.findUnique({ where: { id: outletId } });
      if (!outlet?.isActive) throw new BadRequestException("This outlet is not accepting customers");
      if (await tx.queueEntry.findFirst({ where: { userId, status: { in: active } } })) {
        throw new ConflictException("You already have an active queue entry");
      }
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: outlet.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(new Date());
      const part = (type: string) => parts.find((p) => p.type === type)!.value;
      const date = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
      const counter = await tx.outletDailyCounter.upsert({
        where: { outletId_date: { outletId, date } },
        update: { counter: { increment: 1 } }, create: { outletId, date, counter: 1 },
      });
      return tx.queueEntry.create({ data: { userId, outletId, tokenNumber: counter.counter, status: "PENDING_ACCEPTANCE" } });
    });
    await this.emitQueueUpdate(outletId);
    return entry;
  }

  private async entries(outletId: string) {
    return this.prisma.queueEntry.findMany({
      where: { outletId, status: { in: active } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, outletId: true, tokenNumber: true, status: true, createdAt: true, updatedAt: true, calledAt: true, servedAt: true },
    });
  }

  async getQueue(outletId: string) {
    await this.cleanupStalePendingEntries();
    return this.entries(outletId);
  }

  async getEntry(entryId: string, userId: string) {
    await this.cleanupStalePendingEntries();
    const entry = await this.prisma.queueEntry.findUnique({ where: { id: entryId }, include: { outlet: true } });
    if (!entry) throw new NotFoundException("Queue entry not found");
    if (entry.userId !== userId) throw new ForbiddenException("You can only view your own queue entry");
    return entry;
  }

  async getActiveEntry(userId: string) {
    await this.cleanupStalePendingEntries();
    return this.prisma.queueEntry.findFirst({ where: { userId, status: { in: active } }, include: { outlet: true } });
  }

  async getHistory(userId: string) {
    await this.cleanupStalePendingEntries();
    return this.prisma.queueEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, include: { outlet: true } });
  }

  async advanceQueue(outletId: string, userId: string) {
    await this.prisma.assertOutletOwner(outletId, userId);
    const entry = await this.transaction(async (tx) => {
      if (await tx.queueEntry.findFirst({ where: { outletId, status: "CALLED" } })) {
        throw new ConflictException("Complete the called customer before calling another");
      }
      const next = await tx.queueEntry.findFirst({ where: { outletId, status: "WAITING" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
      if (!next) return null;
      return tx.queueEntry.update({ where: { id: next.id }, data: { status: "CALLED", calledAt: new Date() } });
    });
    if (entry) this.appEvents.emit("token:called", { outletId, payload: { outletId, tokenNumber: entry.tokenNumber } });
    await this.emitQueueUpdate(outletId);
    return entry;
  }

  async leaveQueue(entryId: string, userId: string) {
    const entry = await this.getEntry(entryId, userId);
    if (entry.userId !== userId) throw new ForbiddenException("You can only leave your own queue");
    const result = await this.prisma.queueEntry.updateMany({ where: { id: entryId, userId, status: { in: active } }, data: { status: "CANCELLED" } });
    if (!result.count) throw new ConflictException("This entry is no longer active");
    await this.emitQueueUpdate(entry.outletId);
  }

  private async transition(entryId: string, outletId: string, userId: string, from: QueueStatus[], status: QueueStatus) {
    await this.prisma.assertOutletOwner(outletId, userId);
    await this.cleanupStalePendingEntries();
    const result = await this.prisma.queueEntry.updateMany({
      where: { id: entryId, outletId, status: { in: from } },
      data: { status, ...(status === "SERVED" ? { servedAt: new Date() } : {}) },
    });
    if (!result.count) throw new ConflictException("This queue action is no longer available");
    await this.emitQueueUpdate(outletId);
  }

  acceptEntry(id: string, outletId: string, userId: string) { return this.transition(id, outletId, userId, ["PENDING_ACCEPTANCE"], "WAITING"); }
  rejectEntry(id: string, outletId: string, userId: string) { return this.transition(id, outletId, userId, ["PENDING_ACCEPTANCE", "WAITING"], "MISSED"); }
  markServed(id: string, outletId: string, userId: string) { return this.transition(id, outletId, userId, ["CALLED"], "SERVED"); }
  markMissed(id: string, outletId: string, userId: string) { return this.transition(id, outletId, userId, ["CALLED"], "MISSED"); }

  async cleanupStalePendingEntries() {
    const cutoff = pendingCutoff();
    const stale = await this.prisma.queueEntry.findMany({ where: { status: "PENDING_ACCEPTANCE", createdAt: { lt: cutoff } }, select: { outletId: true } });
    if (!stale.length) return;
    await this.prisma.queueEntry.updateMany({ where: { status: "PENDING_ACCEPTANCE", createdAt: { lt: cutoff } }, data: { status: "MISSED" } });
    for (const outletId of new Set(stale.map((entry) => entry.outletId))) await this.emitQueueUpdate(outletId);
  }

  private async emitQueueUpdate(outletId: string) {
    const entries = await this.entries(outletId);
    const payload: QueueUpdatePayload = { outletId, entries, currentToken: entries.find((entry) => entry.status === "CALLED")?.tokenNumber ?? 0 };
    this.appEvents.emit("queue:update", { outletId, payload });
  }
}

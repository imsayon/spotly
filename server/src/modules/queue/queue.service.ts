import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('queue:miss') private readonly missQueue: Queue,
    private readonly gateway: QueueGateway,
  ) {}

  async joinQueue(merchantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let state = await tx.queueState.findUnique({ where: { merchantId } });
      if (!state) {
        state = await tx.queueState.create({ data: { merchantId } });
      }

      const tokenNumber = state.nextToken;
      await tx.queueState.update({
        where: { merchantId },
        data: { nextToken: { increment: 1 } },
      });

      const entry = await tx.queueEntry.create({
        data: { merchantId, userId, tokenNumber, status: 'WAITING' },
      });

      const position = tokenNumber - state.currentToken;
      this.gateway.emitQueueUpdated(merchantId, { tokenNumber, position, event: 'joined' });

      return { entryId: entry.id, tokenNumber, position };
    });
  }

  async callNext(merchantId: string) {
    const state = await this.prisma.queueState.findUnique({ where: { merchantId } });
    if (!state) throw new NotFoundException('Queue not found for this merchant');

    const nextToken = state.currentToken + 1;
    const entry = await this.prisma.queueEntry.findFirst({
      where: { merchantId, tokenNumber: nextToken, status: 'WAITING' },
    });
    if (!entry) throw new NotFoundException(`No waiting entry for token #${nextToken}`);

    await this.prisma.$transaction([
      this.prisma.queueState.update({ where: { merchantId }, data: { currentToken: nextToken } }),
      this.prisma.queueEntry.update({ where: { id: entry.id }, data: { status: 'CALLED' } }),
    ]);

    // Schedule missed-token job after 3 minutes
    await this.missQueue.add('miss-check', { entryId: entry.id }, { delay: 3 * 60 * 1000 });
    this.gateway.emitQueueUpdated(merchantId, { currentToken: nextToken, event: 'called' });

    return { called: nextToken, entryId: entry.id };
  }

  async redeemToken(entryId: string, otp: string) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    if (entry.status !== 'CALLED') throw new BadRequestException('Token is not in CALLED state');
    if (entry.otp && entry.otp !== otp) throw new BadRequestException('Invalid OTP');

    return this.prisma.queueEntry.update({ where: { id: entryId }, data: { status: 'SERVED' } });
  }

  async getStatus(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Queue entry not found');

    const state = await this.prisma.queueState.findUnique({
      where: { merchantId: entry.merchantId },
    });
    const position = state ? Math.max(0, entry.tokenNumber - state.currentToken) : null;

    return { ...entry, position };
  }
}

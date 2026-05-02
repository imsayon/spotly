import {
  Body, Controller, Get, Param, Post, Delete, UseGuards, HttpCode, HttpStatus, Query, ForbiddenException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { MerchantService } from '../merchant/merchant.service';
import { OutletService } from '../outlet/outlet.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DecodedUser } from '../auth/auth.service';
import { IsNotEmpty, IsString } from 'class-validator';

class JoinQueueDto {
  @IsString()
  @IsNotEmpty()
  outletId!: string;
}

class AdvanceQueueDto {
  @IsString()
  @IsNotEmpty()
  outletId!: string;
}

class ServedDto {
  @IsString()
  @IsNotEmpty()
  outletId!: string;
}

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly merchantService: MerchantService,
    private readonly outletService: OutletService,
  ) {}

  private async verifyMerchantOwnership(userId: string, outletId: string) {
    const merchant = await this.merchantService.findByUser(userId);
    if (!merchant) throw new ForbiddenException('Must be a merchant');
    const outlet = await this.outletService.findById(outletId);
    if (outlet.merchantId !== merchant.id) {
      throw new ForbiddenException('You do not own this outlet');
    }
  }

  /** GET /api/queue/history — consumer's past queue entries */
  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  async getHistory(
    @CurrentUser() user: DecodedUser,
    @Query('limit') limit?: string,
  ) {
    const data = await this.queueService.getHistory(user.uid, limit ? parseInt(limit, 10) : 20);
    return { success: true, data };
  }

  /** GET /api/queue/active — consumer's current active entry */
  @Get('active')
  @UseGuards(FirebaseAuthGuard)
  async getActiveEntry(@CurrentUser() user: DecodedUser) {
    const data = await this.queueService.getActiveEntry(user.uid);
    return { success: true, data };
  }

  /** GET /api/queue/entry/:entryId — consumer polls their own entry */
  @Get('entry/:entryId')
  @UseGuards(FirebaseAuthGuard)
  async getEntry(@Param('entryId') entryId: string, @CurrentUser() user: DecodedUser) {
    const data = await this.queueService.getEntry(entryId);
    
    // Auth check: Only the consumer who created it or the merchant who owns the outlet can view it
    if (data.userId !== user.uid) {
      const merchant = await this.merchantService.findByUser(user.uid).catch(() => null);
      if (!merchant) throw new ForbiddenException('Access denied');
      const outlet = await this.outletService.findById(data.outletId);
      if (outlet.merchantId !== merchant.id) {
        throw new ForbiddenException('Access denied');
      }
    }
    return { success: true, data };
  }

  /** GET /api/queue/:outletId — live queue for an outlet */
  @Get(':outletId')
  async getQueue(@Param('outletId') outletId: string) {
    const data = await this.queueService.getQueue(outletId);
    return { success: true, data };
  }

  /** POST /api/queue/join — consumer joins a queue */
  @Post('join')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async join(
    @CurrentUser() user: DecodedUser,
    @Body() body: JoinQueueDto,
  ) {
    const data = await this.queueService.joinQueue(user.uid, body.outletId);
    return { success: true, data };
  }

  /** POST /api/queue/next — merchant calls next token */
  @Post('next')
  @UseGuards(FirebaseAuthGuard)
  async next(@CurrentUser() user: DecodedUser, @Body() body: AdvanceQueueDto) {
    await this.verifyMerchantOwnership(user.uid, body.outletId);
    const data = await this.queueService.advanceQueue(body.outletId);
    return { success: true, data };
  }

  /** POST /api/queue/served/:entryId — merchant marks as served */
  @Post('served/:entryId')
  @UseGuards(FirebaseAuthGuard)
  async served(
    @CurrentUser() user: DecodedUser,
    @Param('entryId') entryId: string,
    @Body() body: ServedDto,
  ) {
    await this.verifyMerchantOwnership(user.uid, body.outletId);
    await this.queueService.markServed(entryId, body.outletId);
    return { success: true };
  }

  /** POST /api/queue/missed/:entryId — merchant marks as missed (no-show) */
  @Post('missed/:entryId')
  @UseGuards(FirebaseAuthGuard)
  async missed(
    @CurrentUser() user: DecodedUser,
    @Param('entryId') entryId: string,
    @Body() body: ServedDto,
  ) {
    await this.verifyMerchantOwnership(user.uid, body.outletId);
    await this.queueService.markMissed(entryId, body.outletId);
    return { success: true };
  }

  /** POST /api/queue/accept/:entryId — merchant accepts a pending entry */
  @Post('accept/:entryId')
  @UseGuards(FirebaseAuthGuard)
  async accept(
    @CurrentUser() user: DecodedUser,
    @Param('entryId') entryId: string,
    @Body() body: ServedDto,
  ) {
    await this.verifyMerchantOwnership(user.uid, body.outletId);
    await this.queueService.acceptEntry(entryId, body.outletId);
    return { success: true };
  }

  /** DELETE /api/queue/leave/:entryId — consumer leaves queue */
  @Delete('leave/:entryId')
  @UseGuards(FirebaseAuthGuard)
  async leave(
    @Param('entryId') entryId: string,
    @CurrentUser() user: DecodedUser,
  ) {
    await this.queueService.leaveQueue(entryId, user.uid);
    return { success: true };
  }
}

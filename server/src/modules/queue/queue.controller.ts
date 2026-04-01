import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { QueueService } from './queue.service';

class JoinQueueDto {
  @IsString() @IsNotEmpty() userId: string;
}

class RedeemTokenDto {
  @IsString() @IsNotEmpty() otp: string;
}

@Controller('merchants')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /** POST /api/v1/merchants/:merchantId/queue — User joins queue */
  @Post(':merchantId/queue')
  join(@Param('merchantId') merchantId: string, @Body() dto: JoinQueueDto) {
    return this.queueService.joinQueue(merchantId, dto.userId);
  }

  /** GET /api/v1/merchants/:merchantId/queue/:entryId — Token status + position */
  @Get(':merchantId/queue/:entryId')
  status(@Param('entryId') entryId: string) {
    return this.queueService.getStatus(entryId);
  }

  /** POST /api/v1/merchants/:merchantId/queue/advance — Merchant calls next token */
  @Post(':merchantId/queue/advance')
  advance(@Param('merchantId') merchantId: string) {
    return this.queueService.callNext(merchantId);
  }

  /** POST /api/v1/merchants/queue/:entryId/arrived — User redeems token with OTP */
  @Post('queue/:entryId/arrived')
  redeem(@Param('entryId') entryId: string, @Body() dto: RedeemTokenDto) {
    return this.queueService.redeemToken(entryId, dto.otp);
  }
}

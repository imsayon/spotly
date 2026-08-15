import { Module } from "@nestjs/common";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";
import { QueueGateway } from "./queue.gateway";
import { QueueCronService } from "./queue-cron.service";

@Module({
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, QueueCronService],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}

import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { QueueService } from "./queue.service"

@Injectable()
export class QueueCronService {
	private readonly logger = new Logger(QueueCronService.name)

	constructor(private readonly queueService: QueueService) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async handleStaleEntriesCleanup() {
		try {
			await this.queueService.cleanupStalePendingEntries()
		} catch (err) {
			this.logger.error("Failed to run stale queue entries cleanup", err)
		}
	}
}

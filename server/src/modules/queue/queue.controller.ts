import { JoinQueueDtoSchema } from "@spotly/types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
	Controller,
	Get,
	Post,
	Patch,
	Param,
	Body,
	UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { QueueService } from "./queue.service"
import { JwtAuthGuard } from "../../infra/auth/jwt-auth.guard"
import { CurrentUser } from "../../infra/auth/current-user.decorator"
import { JoinQueueDto } from "@spotly/types"

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
	constructor(private readonly queueService: QueueService) {}

	@Post("join")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Consumer joins an outlet queue" })
	async join(@CurrentUser("id") userId: string, @Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto) {
		return this.queueService.joinQueue(userId, dto.outletId)
	}

  @Get("entry/:id")
  @UseGuards(JwtAuthGuard)
  async getEntry(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.queueService.getEntry(id, userId);
  }

	@Get("active")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get current active queue entry for user" })
	async getActive(@CurrentUser("id") userId: string) {
		return this.queueService.getActiveEntry(userId)
	}

	@Get("history")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get queue entry history for user" })
	async getHistory(@CurrentUser("id") userId: string) {
		return this.queueService.getHistory(userId)
	}

	@Get("outlet/:outletId")
	@ApiOperation({ summary: "Get active queue list for an outlet" })
	async getOutletQueue(@Param("outletId") outletId: string) {
		return this.queueService.getQueue(outletId)
	}

	@Post("outlet/:outletId/advance")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Merchant calls next waiting token" })
	async advanceQueue(@CurrentUser("id") userId: string, @Param("outletId") outletId: string) {
		return this.queueService.advanceQueue(outletId, userId)
	}

	@Patch("entry/:id/leave")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Consumer leaves active queue" })
	async leaveQueue(
		@Param("id") entryId: string,
		@CurrentUser("id") userId: string,
	) {
		await this.queueService.leaveQueue(entryId, userId)
		return { success: true }
	}

	@Patch("entry/:id/accept")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Merchant accepts pending queue entry" })
	async acceptEntry(
		@Param("id") entryId: string,
		@Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto,
    @CurrentUser("id") userId: string,
	) {
		await this.queueService.acceptEntry(entryId, dto.outletId, userId)
		return { success: true }
	}

	@Patch("entry/:id/reject")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Merchant rejects pending queue entry" })
	async rejectEntry(
		@Param("id") entryId: string,
		@Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto,
    @CurrentUser("id") userId: string,
	) {
		await this.queueService.rejectEntry(entryId, dto.outletId, userId)
		return { success: true }
	}

	@Patch("entry/:id/served")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Merchant marks token as served" })
	async markServed(
		@Param("id") entryId: string,
		@Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto,
    @CurrentUser("id") userId: string,
	) {
		await this.queueService.markServed(entryId, dto.outletId, userId)
		return { success: true }
	}

	@Patch("entry/:id/missed")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Merchant marks token as missed" })
	async markMissed(
		@Param("id") entryId: string,
		@Body(new ZodValidationPipe(JoinQueueDtoSchema)) dto: JoinQueueDto,
    @CurrentUser("id") userId: string,
	) {
		await this.queueService.markMissed(entryId, dto.outletId, userId)
		return { success: true }
	}
}

import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Delete,
	UseGuards,
	HttpCode,
	HttpStatus,
	ForbiddenException,
} from "@nestjs/common"
import { QueueService } from "./queue.service"
import { FirebaseAuthGuard } from "../auth/guards/firebase-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"
import { DecodedUser } from "../auth/auth.service"
import { IsNotEmpty, IsString } from "class-validator"

class JoinQueueDto {
	@IsString()
	@IsNotEmpty()
	outletId!: string
}

class AdvanceQueueDto {
	@IsString()
	@IsNotEmpty()
	outletId!: string
}

class ServedDto {
	@IsString()
	@IsNotEmpty()
	outletId!: string
}

@Controller("queue")
export class QueueController {
	constructor(private readonly queueService: QueueService) {}

	/** GET /api/queue/history/:userId — consumer gets their queue history */
	@Get("history/:userId")
	@UseGuards(FirebaseAuthGuard)
	async getHistory(
		@Param("userId") userId: string,
		@CurrentUser() user: DecodedUser,
	) {
		if (userId !== user.uid)
			throw new ForbiddenException("Forbidden access to history")
		const data = await this.queueService.getHistory(userId)
		return { success: true, data }
	}

	/** GET /api/queue/entry/:entryId — consumer polls their own entry */
	@Get("entry/:entryId")
	@UseGuards(FirebaseAuthGuard)
	async getEntry(@Param("entryId") entryId: string) {
		const data = await this.queueService.getEntry(entryId)
		return { success: true, data }
	}

	/** GET /api/queue/:outletId — live queue for an outlet with avg wait time */
	@Get(":outletId")
	async getQueue(@Param("outletId") outletId: string) {
		const { entries, avgWaitPerPerson, outletName } =
			await this.queueService.getQueue(outletId)
		return {
			success: true,
			data: { entries, avgWaitPerPerson, outletName },
		}
	}

	/** POST /api/queue/join — consumer joins a queue */
	@Post("join")
	@UseGuards(FirebaseAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	async join(@CurrentUser() user: DecodedUser, @Body() body: JoinQueueDto) {
		const data = await this.queueService.joinQueue(user.uid, body.outletId)
		return { success: true, data }
	}

	/** POST /api/queue/next — merchant calls next token */
	@Post("next")
	@UseGuards(FirebaseAuthGuard)
	async next(@Body() body: AdvanceQueueDto) {
		const data = await this.queueService.advanceQueue(body.outletId)
		return { success: true, data }
	}

	/** POST /api/queue/served/:entryId — merchant marks as served */
	@Post("served/:entryId")
	@UseGuards(FirebaseAuthGuard)
	async served(@Param("entryId") entryId: string, @Body() body: ServedDto) {
		await this.queueService.markServed(entryId, body.outletId)
		return { success: true }
	}

	/** POST /api/queue/missed/:entryId — merchant marks as missed (no-show) */
	@Post("missed/:entryId")
	@UseGuards(FirebaseAuthGuard)
	async missed(@Param("entryId") entryId: string, @Body() body: ServedDto) {
		await this.queueService.markMissed(entryId, body.outletId)
		return { success: true }
	}

	/** DELETE /api/queue/leave/:entryId — consumer leaves queue */
	@Delete("leave/:entryId")
	@UseGuards(FirebaseAuthGuard)
	async leave(
		@Param("entryId") entryId: string,
		@CurrentUser() user: DecodedUser,
	) {
		await this.queueService.leaveQueue(entryId, user.uid)
		return { success: true }
	}

}

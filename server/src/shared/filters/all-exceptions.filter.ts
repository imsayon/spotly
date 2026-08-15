import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common"
import { Response } from "express"
import { RequestWithId } from "../middleware/request-id.middleware"

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name)

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<RequestWithId>()

		const requestId = request?.id || "unknown"
		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR

		let errorCode = "INTERNAL_SERVER_ERROR"
		let message = "An unexpected error occurred"
		let details: any = undefined

		if (exception instanceof HttpException) {
			const res = exception.getResponse()
			if (typeof res === "string") {
				message = res
			} else if (typeof res === "object" && res !== null) {
				const obj = res as any
				message = obj.message || exception.message
				errorCode = obj.error || exception.name
				details = obj.details
			}
		} else if (exception instanceof Error) {
			message = exception.message
			errorCode = exception.name
			this.logger.error(`[${requestId}] ${exception.stack}`)
		}

		response.status(status).json({
			error: {
				code: errorCode,
				message,
				...(details ? { details } : {}),
			},
			meta: {
				requestId,
				timestamp: new Date().toISOString(),
			},
		})
	}
}

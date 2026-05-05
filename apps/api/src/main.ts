import * as dotenv from "dotenv"
dotenv.config()

import { NestFactory } from "@nestjs/core"
import {
	ValidationPipe,
	Logger,
	Catch,
	ExceptionFilter,
	HttpException,
	ArgumentsHost,
} from "@nestjs/common"
import { AppModule } from "./app.module"

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse()
		const request = ctx.getRequest()

		const status =
			exception instanceof HttpException ? exception.getStatus() : 500

		response.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			message:
				exception instanceof Error
					? exception.message
					: "Internal server error",
		})
	}
}

async function bootstrap() {
	const logger = new Logger("Bootstrap")
	try {
		const app = await NestFactory.create(AppModule)

		// ─── Global Validation Pipe ─────────────────────────────────────────────────
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		)

		// ─── Global Exception Filter ────────────────────────────────────────────────
		app.useGlobalFilters(new AllExceptionsFilter())

		// ─── CORS ───────────────────────────────────────────────────────────────────
		app.enableCors({
			origin: [
				process.env.CONSUMER_URL ?? "http://localhost:3000",
				"http://localhost:3003",
				process.env.MERCHANT_URL ?? "http://localhost:3002",
			],
			credentials: true,
		})

		// ─── Global Prefix ──────────────────────────────────────────────────────────
		app.setGlobalPrefix("api")

		const port = process.env.PORT ?? 3001
		logger.log(`Attempting to listen on port ${port}...`)

		// Bind to 0.0.0.0 explicitly for Render
		await app.listen(port, "0.0.0.0")
		logger.log(`Spotly API running on http://0.0.0.0:${port}/api`)
	} catch (error) {
		logger.error("CRITICAL BOOTSTRAP ERROR:", error)
		console.error("Raw error object:", error)
		process.exit(1)
	}
}

bootstrap()

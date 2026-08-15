import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { LoggerService } from "./infra/logger/logger.service"
import { TransformInterceptor } from "./shared/interceptors/transform.interceptor"
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter"

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	})

	const logger = app.get(LoggerService)
	app.useLogger(logger)

	// Security headers & CORS
	app.use(helmet())
	app.enableCors({
		origin: [
			process.env["CONSUMER_URL"] || "http://localhost:3000",
			process.env["MERCHANT_URL"] || "http://localhost:3002",
			"http://localhost:3000",
			"http://localhost:3002",
		],
		credentials: true,
	})

	// Global prefix
	app.setGlobalPrefix("api/v1")

	// Global pipes, filters, interceptors
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	)
	app.useGlobalInterceptors(new TransformInterceptor())
	app.useGlobalFilters(new AllExceptionsFilter())

	// Swagger Documentation Setup
	const config = new DocumentBuilder()
		.setTitle("Spotly API")
		.setDescription(
			"Digital Queue Management & Merchant Discovery Platform API",
		)
		.setVersion("2.0.0")
		.addBearerAuth()
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup("api/docs", app, document)

	// Enable Graceful Shutdown
	app.enableShutdownHooks()

	const port = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 3001
	await app.listen(port)
	logger.log(
		`🚀 Spotly NestJS Server running on port ${port} (Env: ${process.env["NODE_ENV"] || "development"})`,
	)
}

bootstrap().catch((err) => {
	console.error("❌ Failed to start Spotly server:", err)
	process.exit(1)
})

import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { ThrottlerModule } from "@nestjs/throttler"
import { z } from "zod"

import { PrismaModule } from "./infra/prisma/prisma.module"
import { LoggerService } from "./infra/logger/logger.service"
import { RequestIdMiddleware } from "./shared/middleware/request-id.middleware"
import { AppEventsModule } from "./shared/events/app-events.module"

import { HealthModule } from "./modules/health/health.module"
import { UserModule } from "./modules/user/user.module"
import { MerchantModule } from "./modules/merchant/merchant.module"
import { OutletModule } from "./modules/outlet/outlet.module"
import { QueueModule } from "./modules/queue/queue.module"
import { MenuModule } from "./modules/menu/menu.module"
import { ReviewModule } from "./modules/review/review.module"
import { FavoriteModule } from "./modules/favorite/favorite.module"

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.string().default("3001"),
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	CONSUMER_URL: z.string().optional(),
	MERCHANT_URL: z.string().optional(),
	SUPABASE_URL: z.string().optional(),
	NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
	SUPABASE_ANON_KEY: z.string().optional(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
})

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (config) => envSchema.parse(config),
		}),
		ScheduleModule.forRoot(),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
			},
		]),
		PrismaModule,
		AppEventsModule,
		HealthModule,
		UserModule,
		MerchantModule,
		OutletModule,
		QueueModule,
		MenuModule,
		ReviewModule,
		FavoriteModule,
	],
	providers: [LoggerService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestIdMiddleware).forRoutes("*")
	}
}

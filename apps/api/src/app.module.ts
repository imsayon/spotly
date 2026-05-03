import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AuthModule } from "./modules/auth/auth.module"
import { UserModule } from "./modules/user/user.module"
import { MerchantModule } from "./modules/merchant/merchant.module"
import { OutletModule } from "./modules/outlet/outlet.module"
import { QueueModule } from "./modules/queue/queue.module"
import { MenuModule } from "./modules/menu/menu.module"
import { WebsocketModule } from "./modules/websocket/websocket.module"
import { IntegrationModule } from "./modules/integration/integration.module"
import { ReviewModule } from "./modules/review/review.module"
import { FavoriteModule } from "./modules/favorite/favorite.module"
import { PrismaModule } from "./prisma/prisma.module"

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
	imports: [
		ThrottlerModule.forRoot([{
			ttl: 60000,
			limit: 100,
		}]),
		PrismaModule,
		AuthModule,
		UserModule,
		MerchantModule,
		OutletModule,
		QueueModule,
		MenuModule,
		WebsocketModule,
		IntegrationModule,
		ReviewModule,
		FavoriteModule,
	],
	controllers: [AppController],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}

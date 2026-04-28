import { Module } from "@nestjs/common"
import { FavoriteService } from "./favorite.service"
import { FavoriteController } from "./favorite.controller"
import { PrismaModule } from "../../prisma/prisma.module"
import { AuthModule } from "../auth/auth.module"

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [FavoriteController],
	providers: [FavoriteService],
	exports: [FavoriteService],
})
export class FavoriteModule {}

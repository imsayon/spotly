import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig], envFilePath: '.env' }),
    PrismaModule,
    RedisModule,
    QueueModule,
    MerchantsModule,
    UsersModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { OutletModule } from './modules/outlet/outlet.module';
import { QueueModule } from './modules/queue/queue.module';
import { MenuModule } from './modules/menu/menu.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    FirebaseModule,
    AuthModule,
    UserModule,
    MerchantModule,
    OutletModule,
    QueueModule,
    MenuModule,
    WebsocketModule,
    IntegrationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

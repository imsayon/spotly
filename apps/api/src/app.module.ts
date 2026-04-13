import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { OutletModule } from './modules/outlet/outlet.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { IntegrationModule } from './modules/integration/integration.module';

@Module({
  imports: [
    FirebaseModule,
    AuthModule,
    UserModule,
    MerchantModule,
    OutletModule,
    QueueModule,
    WebsocketModule,
    IntegrationModule,
  ],
})
export class AppModule {}

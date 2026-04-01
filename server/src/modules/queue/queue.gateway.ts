import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/queue' })
export class QueueGateway {
  private readonly logger = new Logger(QueueGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() merchantId: string, @ConnectedSocket() client: Socket) {
    client.join(`merchant:${merchantId}`);
    this.logger.log(`Client ${client.id} joined room merchant:${merchantId}`);
    return { event: 'joinedRoom', data: merchantId };
  }

  emitQueueUpdated(merchantId: string, payload: Record<string, unknown>) {
    this.server.to(`merchant:${merchantId}`).emit('queue_updated', payload);
  }

  emitPositionChanged(merchantId: string, payload: Record<string, unknown>) {
    this.server.to(`merchant:${merchantId}`).emit('position_changed', payload);
  }
}

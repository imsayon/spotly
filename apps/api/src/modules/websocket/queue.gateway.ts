import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QueueUpdatePayload, TokenCalledPayload } from '@spotly/types';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.CONSUMER_URL ?? 'http://localhost:3000',
      'http://localhost:3003',
      process.env.MERCHANT_URL ?? 'http://localhost:3002',
    ],
    credentials: true,
  },
  namespace: '/',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(QueueGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client emits 'join_outlet' to subscribe to a specific outlet's queue updates.
   * They join the Socket.IO room `outlet:{outletId}`.
   */
  @SubscribeMessage('join_outlet')
  handleJoinOutlet(
    @MessageBody() data: { outletId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `outlet:${data.outletId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joined', { room });
  }

  /**
   * Client emits 'leave_outlet' to unsubscribe from an outlet's updates.
   */
  @SubscribeMessage('leave_outlet')
  handleLeaveOutlet(
    @MessageBody() data: { outletId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `outlet:${data.outletId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  /**
   * Emit `queue_update` to all clients watching an outlet.
   * Called by QueueService after every DB write.
   */
  async emitQueueUpdate(outletId: string, payload: QueueUpdatePayload): Promise<void> {
    this.server.to(`outlet:${outletId}`).emit('queue_update', payload);
  }

  /**
   * Emit `token_called` when merchant calls the next token.
   */
  async emitTokenCalled(outletId: string, payload: TokenCalledPayload): Promise<void> {
    this.server.to(`outlet:${outletId}`).emit('token_called', payload);
  }
}

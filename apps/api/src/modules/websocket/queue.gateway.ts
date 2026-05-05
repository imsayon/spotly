import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QueueUpdatePayload, TokenCalledPayload } from '@spotly/types';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

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
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(QueueGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        if (!this.authService.isFunctional) {
          return next(new Error('Unauthorized: Auth service unavailable'));
        }

        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Unauthorized: No token provided'));
        }

        const decoded = await this.authService.verifyToken(token);
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Unauthorized: Invalid token'));
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id} (User: ${client.data.user?.uid})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client emits 'join_outlet' to subscribe to a specific outlet's queue updates.
   * They join the Socket.IO room `outlet:{outletId}`.
   */
  @SubscribeMessage('join_outlet')
  async handleJoinOutlet(
    @MessageBody() data: { outletId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.uid;
    if (!userId || !data?.outletId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const [activeEntry, outlet] = await Promise.all([
      this.prisma.queueEntry.findFirst({
        where: {
          userId,
          outletId: data.outletId,
          status: { in: ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'] },
        },
        select: { id: true },
      }),
      this.prisma.outlet.findUnique({
        where: { id: data.outletId },
        select: {
          merchant: {
            select: { ownerId: true },
          },
        },
      }),
    ]);

    const isMerchant = outlet?.merchant.ownerId === userId;
    const isParticipant = Boolean(activeEntry);
    if (!isMerchant && !isParticipant) {
      client.emit('error', { message: 'Not authorized for this outlet' });
      this.logger.warn(`Client ${client.id} denied room outlet:${data.outletId}`);
      return;
    }

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

  @SubscribeMessage('join_outlet_status')
  handleJoinOutletStatus(
    @MessageBody() data: { outletId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!client.data.user?.uid || !data?.outletId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const room = `outlet_status:${data.outletId}`;
    client.join(room);
    client.emit('joined', { room });
  }

  @SubscribeMessage('leave_outlet_status')
  handleLeaveOutletStatus(
    @MessageBody() data: { outletId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `outlet_status:${data.outletId}`;
    client.leave(room);
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
  async emitTokenCalled(outletId: string, payload: Omit<TokenCalledPayload, 'userId'>): Promise<void> {
    this.server.to(`outlet:${outletId}`).emit('token_called', payload);
  }

  /**
   * Emit `entry_update` to inform consumers of their entry status.
   */
  async emitEntryUpdate(outletId: string, payload: { entryId: string; status: string }): Promise<void> {
    this.server.to(`outlet:${outletId}`).emit('entry_update', payload);
  }

  async emitOutletStatus(outletId: string, payload: { outletId: string; isActive: boolean; isOpen?: boolean }): Promise<void> {
    this.server.to(`outlet_status:${outletId}`).emit('outlet_status', payload);
    this.server.to(`outlet:${outletId}`).emit('outlet_status', payload);
  }

  async notifyOutletStatusChange(outletId: string, isOpen: boolean): Promise<void> {
    await this.emitOutletStatus(outletId, { outletId, isActive: isOpen, isOpen });
  }
}

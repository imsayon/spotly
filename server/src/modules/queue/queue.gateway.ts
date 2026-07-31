import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { QueueUpdatePayload, TokenCalledPayload } from "@spotly/types";
import { AppEventsService } from "../../shared/events/app-events.service";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(QueueGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly appEvents: AppEventsService) {}

  onModuleInit() {
    this.appEvents.on("queue:update", ({ outletId, payload }: { outletId: string; payload: QueueUpdatePayload }) => {
      this.broadcastQueueUpdate(outletId, payload);
    });

    this.appEvents.on("token:called", ({ outletId, payload }: { outletId: string; payload: TokenCalledPayload }) => {
      this.broadcastTokenCalled(outletId, payload);
    });
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join_outlet_room")
  handleJoinRoom(client: Socket, outletId: string) {
    client.join(`outlet:${outletId}`);
    this.logger.debug(`Client ${client.id} joined room outlet:${outletId}`);
    return { status: "joined", outletId };
  }

  @SubscribeMessage("leave_outlet_room")
  handleLeaveRoom(client: Socket, outletId: string) {
    client.leave(`outlet:${outletId}`);
    this.logger.debug(`Client ${client.id} left room outlet:${outletId}`);
    return { status: "left", outletId };
  }

  broadcastQueueUpdate(outletId: string, payload: QueueUpdatePayload) {
    this.server?.to(`outlet:${outletId}`).emit("queue_update", payload);
  }

  broadcastTokenCalled(outletId: string, payload: TokenCalledPayload) {
    this.server?.to(`outlet:${outletId}`).emit("token_called", payload);
  }
}

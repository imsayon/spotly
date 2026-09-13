import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Server, Socket } from "socket.io";
import { QueueUpdatePayload, TokenCalledPayload } from "@spotly/types";
import { AppEventsService } from "../../shared/events/app-events.service";

@WebSocketGateway({
  cors: {
    origin: [process.env.CONSUMER_URL || "http://localhost:3000", process.env.MERCHANT_URL || "http://localhost:3002"],
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(QueueGateway.name);
  private supabaseClient: SupabaseClient | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(private readonly appEvents: AppEventsService, private readonly configService: ConfigService) {}

  private getSupabaseClient() {
    if (this.supabaseClient) return this.supabaseClient;
    const url = this.configService?.get<string>("SUPABASE_URL") || this.configService?.get<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key = this.configService?.get<string>("SUPABASE_ANON_KEY") || this.configService?.get<string>("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!url || !key) return null;
    this.supabaseClient = createClient(url, key);
    return this.supabaseClient;
  }

  onModuleInit() {
    this.appEvents.on("queue:update", ({ outletId, payload }: { outletId: string; payload: QueueUpdatePayload }) => {
      this.broadcastQueueUpdate(outletId, payload);
    });

    this.appEvents.on("token:called", ({ outletId, payload }: { outletId: string; payload: TokenCalledPayload }) => {
      this.broadcastTokenCalled(outletId, payload);
    });
  }

  async handleConnection(client: Socket) {
    const auth = client.handshake.auth as { accessToken?: unknown } | undefined;
    const header = client.handshake.headers.authorization;
    const token = typeof auth?.accessToken === "string"
      ? auth.accessToken
      : typeof header === "string" && header.startsWith("Bearer ")
        ? header.slice(7)
        : "";
    const supabase = this.getSupabaseClient();
    if (!token || !supabase) {
      client.disconnect(true);
      return;
    }
    let user: import("@supabase/supabase-js").User | null = null;
    let error: { message?: string } | null = null;
    try {
      ({ data: { user }, error } = await supabase.auth.getUser(token));
    } catch {
      client.disconnect(true);
      return;
    }
    if (error || !user) {
      client.disconnect(true);
      return;
    }
    client.data.userId = user.id;
    this.logger.debug(`Client ${client.id} authenticated`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join_outlet_room")
  handleJoinRoom(client: Socket, outletId: string) {
    if (!client.data.userId || !/^[0-9a-f-]{36}$/i.test(outletId)) return { status: "rejected" };
    client.join(`outlet:${outletId}`);
    this.logger.debug(`Client ${client.id} joined room outlet:${outletId}`);
    return { status: "joined", outletId };
  }

  @SubscribeMessage("leave_outlet_room")
  handleLeaveRoom(client: Socket, outletId: string) {
    if (!client.data.userId || !/^[0-9a-f-]{36}$/i.test(outletId)) return { status: "rejected" };
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

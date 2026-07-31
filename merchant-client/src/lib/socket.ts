import { io, Socket } from "socket.io-client"
import { QueueUpdatePayload, TokenCalledPayload } from "@spotly/types"
import { env } from "./env"

let socket: Socket | null = null

export function getQueueSocket(): Socket {
	if (!socket) {
		socket = io(env.NEXT_PUBLIC_WS_URL, {
			transports: ["websocket", "polling"],
			autoConnect: true,
		})
	}
	return socket
}

export function subscribeToOutlet(
	outletId: string,
	handlers: {
		onQueueUpdate?: (payload: QueueUpdatePayload) => void
		onTokenCalled?: (payload: TokenCalledPayload) => void
	},
	onConnected?: () => void,
): () => void {
	const s = getQueueSocket()

	const handleConnect = () => {
		s.emit("join_outlet_room", outletId)
		onConnected?.()
	}

	s.on("connect", handleConnect)

	if (s.connected) {
		s.emit("join_outlet_room", outletId)
		onConnected?.()
	}

	const handleQueueUpdate = (payload: QueueUpdatePayload) => {
		handlers.onQueueUpdate?.(payload)
	}

	const handleTokenCalled = (payload: TokenCalledPayload) => {
		handlers.onTokenCalled?.(payload)
	}

	s.on("queue_update", handleQueueUpdate)
	s.on("token_called", handleTokenCalled)

	return () => {
		s.emit("leave_outlet_room", outletId)
		s.off("connect", handleConnect)
		s.off("queue_update", handleQueueUpdate)
		s.off("token_called", handleTokenCalled)
	}
}

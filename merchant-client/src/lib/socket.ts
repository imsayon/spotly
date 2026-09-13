import { io, Socket } from "socket.io-client"
import { QueueUpdatePayload, TokenCalledPayload } from "@spotly/types"
import { env } from "./env"
import { supabase } from "./supabase"

let socket: Socket | null = null
let socketAuthToken = ""

async function connectWithSession(s: Socket) {
	try {
		const { data: { session } } = await supabase.auth.getSession()
		const token = session?.access_token || ""
		if (!token) {
			s.disconnect()
			return
		}
		if (s.connected && socketAuthToken !== token) s.disconnect()
		socketAuthToken = token
		if (!s.connected) s.connect()
	} catch {
		s.disconnect()
	}
}

export function getQueueSocket(): Socket {
	if (!socket) {
		socket = io(env.NEXT_PUBLIC_WS_URL, {
			transports: ["websocket", "polling"],
			autoConnect: false,
			auth: (callback) => {
				void supabase.auth.getSession().then(({ data: { session } }) => {
					callback({ accessToken: session?.access_token || "" })
				}).catch(() => callback({ accessToken: "" }))
			},
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
	onDisconnected?: () => void,
): () => void {
	const s = getQueueSocket()
	void connectWithSession(s)

	const handleConnect = () => {
		s.emit("join_outlet_room", outletId)
		onConnected?.()
	}
	const handleDisconnect = () => onDisconnected?.()

	s.on("connect", handleConnect)
	s.on("disconnect", handleDisconnect)
	s.on("connect_error", handleDisconnect)

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
		s.off("disconnect", handleDisconnect)
		s.off("connect_error", handleDisconnect)
		s.off("queue_update", handleQueueUpdate)
		s.off("token_called", handleTokenCalled)
	}
}

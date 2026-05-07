import { io, Socket } from "socket.io-client"
import { supabase } from "./supabase"

let socket: Socket | null = null
let socketPromise: Promise<Socket> | null = null

export function getSocket(): Promise<Socket> {
	if (socket?.connected) return Promise.resolve(socket)
	if (socketPromise) return socketPromise

	if (socket) {
		socket.disconnect()
		socket = null
	}

	socketPromise = new Promise((resolve, reject) => {
		const s = io(
			process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001",
			{
				transports: ["websocket"],
				auth: async (cb) => {
					const {
						data: { session },
					} = await supabase.auth.getSession()
					cb({ token: session?.access_token })
				},
				autoConnect: true,
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 2000,
			},
		)

		s.once("connect", () => {
			socket = s
			socketPromise = null
			resolve(s)
		})
		s.once("connect_error", (err) => {
			socketPromise = null
			reject(err)
		})
	})

	return socketPromise
}

export async function joinOutletRoom(outletId: string): Promise<void> {
	const s = await getSocket()
	s.emit("join_outlet", { outletId })
}

export async function leaveOutletRoom(outletId: string): Promise<void> {
	const s = await getSocket()
	s.emit("leave_outlet", { outletId })
}

export async function disconnectSocket(): Promise<void> {
	socket?.disconnect()
	socket = null
}

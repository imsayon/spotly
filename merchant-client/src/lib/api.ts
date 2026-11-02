import axios from "axios"
import { supabase } from "./supabase"
import { env } from "./env"

const api = axios.create({
	baseURL: env.NEXT_PUBLIC_API_URL,
	timeout: 20_000,
	headers: { "Content-Type": "application/json" },
})

// ─── Request Interceptor — Attach Supabase JWT ──────────────────────────
api.interceptors.request.use(async (config) => {
	try {
		const {
			data: { session },
		} = await supabase.auth.getSession()
		if (session?.access_token) {
			if (!config.headers) config.headers = {} as any
			config.headers.Authorization = `Bearer ${session.access_token}`
		}
	} catch {
		/* public routes */
	}
	return config
})

// ─── Response Interceptor — Preserve full error for catch blocks ─────────
api.interceptors.response.use(
	(r) => r,
	(err) => {
		if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
			err.message = "Spotly is taking too long to respond. Refresh to check the latest status before trying again."
		} else if (err.code === "ERR_NETWORK") {
			err.message = "Spotly could not be reached. Check your connection and try again."
		} else if (err.response) {
			err.message =
				err.response.data?.error?.message ??
				err.response.data?.message ??
				err.response.statusText ??
				"Request failed"
		}
		return Promise.reject(err)
	},
)

export default api

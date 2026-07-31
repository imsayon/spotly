import { createClient } from "@supabase/supabase-js"
import { env } from "./env"

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const customStorage = {
	getItem: (key: string) => {
		if (typeof window === "undefined") return null
		return window.localStorage.getItem(key)
	},
	setItem: (key: string, value: string) => {
		if (typeof window === "undefined") return
		window.localStorage.setItem(key, value)
	},
	removeItem: (key: string) => {
		if (typeof window === "undefined") return
		window.localStorage.removeItem(key)
	},
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		detectSessionInUrl: true,
		persistSession: true,
		storage: customStorage,
	},
})

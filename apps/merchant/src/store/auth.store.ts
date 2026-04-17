import { create } from "zustand"
import { getFirebaseAuth } from "@/lib/firebase"
import {
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	type User as FirebaseUser,
} from "firebase/auth"
import api from "@/lib/api"

export interface MerchantProfile {
	id: string
	ownerId: string
	name: string
	category: string
	description?: string
	phone?: string
	contactEmail?: string
}
interface AuthState {
	user: FirebaseUser | null
	merchantProfile: MerchantProfile | null
	loading: boolean
	setUser: (user: FirebaseUser | null) => void
	fetchMerchantProfile: () => Promise<MerchantProfile | null>
	setMerchantProfile: (profile: MerchantProfile | null) => void
	signInWithGoogle: () => Promise<void>
	signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
	user: null,
	merchantProfile: null,
	loading: true,

	setUser: (user) => {
		set({ user, loading: false })
	},

	fetchMerchantProfile: async () => {
		set({ loading: true })
		try {
			const response = await api.get("/merchant/me/profile")
			const profile = response.data.data
			set({ merchantProfile: profile, loading: false })
			return profile
		} catch (err: any) {
			set({ merchantProfile: null, loading: false })
			return null
		}
	},

	setMerchantProfile: (profile: any) => set({ merchantProfile: profile }),

	signInWithGoogle: async () => {
		const provider = new GoogleAuthProvider()
		try {
			await signInWithPopup(getFirebaseAuth(), provider)
		} catch (error) {
			console.error("Merchant Google Sign-In Error:", error)
			throw error
		}
	},

	signOut: async () => {
		try {
			await firebaseSignOut(getFirebaseAuth())
			set({ user: null, merchantProfile: null, loading: false })
			if (typeof window !== "undefined") {
				window.location.href = "/"
			}
		} catch (error) {
			console.error("Merchant Sign-Out Error:", error)
		}
	},
}))

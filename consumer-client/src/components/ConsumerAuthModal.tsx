"use client"

import { useRouter } from "next/navigation"
import { AuthModal } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"

export function ConsumerAuthModal({ isOpen, onClose, title = "Continue to Spotly" }: { isOpen: boolean; onClose: () => void; title?: string }) {
	const router = useRouter()
	const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore()

	return <AuthModal
		isOpen={isOpen}
		onClose={onClose}
		onGoogleAuth={async () => { await signInWithGoogle(); onClose(); router.replace("/home") }}
		onEmailAuth={async (email, password, mode, name) => {
		if (mode === "sign-up") {
			if (!await signUpWithEmail(email, password, name)) return "Check your email to confirm your account, then sign in."
		} else await signInWithEmail(email, password)
		onClose()
		router.replace("/home")
	}}
		title={title}
		variant="consumer"
	/>
}

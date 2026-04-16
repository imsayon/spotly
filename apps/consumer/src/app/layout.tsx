import { Outfit } from "next/font/google"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
	title: "Spotly Consumer",
	description:
		"Skip the line. Join queues remotely. Get live updates. Never wait in line again.",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${outfit.variable} font-sans bg-background text-white min-h-screen`}
			>
				<AuthProvider>
					<ServiceWorkerRegistration />
					{children}
				</AuthProvider>
			</body>
		</html>
	)
}

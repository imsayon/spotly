"use client"

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import { useRouter } from "next/navigation"
import { AuthModal, Ic, ThemeToggle } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { env } from "@/lib/env"

const steps = [
	["01", "Set up your outlet", "Add your business, hours and the services customers come in for."],
	["02", "Accept requests", "Review incoming requests and decide who is ready to join the live queue."],
	["03", "Call and complete", "Call the next customer, mark the visit complete, and keep the room moving."],
] as const

export default function MerchantLandingPage() {
	const router = useRouter()
	const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuthStore()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!loading && user) router.replace("/dashboard")
	}, [loading, router, user])

	if (loading) return <div className="marketing-page" aria-label="Loading Spotly" />

	return (
		<div className="marketing-page">
			<header className="marketing-header">
				<a href="#top" className="brand-lockup" aria-label="Spotly for businesses home"><span className="brand-mark"><Ic.Store size={17} /></span><span className="brand-name">spotly. / business</span></a>
				<nav className="marketing-nav" aria-label="Primary navigation"><a href="#how">How it works</a><a href="#capabilities">Capabilities</a><a href={env.NEXT_PUBLIC_CONSUMER_URL}>For customers</a></nav>
				<div className="marketing-actions"><ThemeToggle /><button className="button-secondary" onClick={() => setOpen(true)}>Sign in</button></div>
			</header>

			<main id="top" className="marketing-main">
				<section className="marketing-hero" aria-labelledby="merchant-title">
					<div><div className="eyebrow">A clearer front desk</div><h1 id="merchant-title">Keep your queue <span>moving.</span></h1><p>Accept requests, call the next customer, and manage walk-ins from one calm operator view. Your team stays present; Spotly handles the line.</p><div className="marketing-cta"><button className="button-primary" onClick={() => setOpen(true)}>Set up your business <Ic.Arrow /></button><a className="button-secondary" href="#how">See how it works</a></div></div>
					<OperatorPreview />
				</section>

				<section id="how" className="marketing-section" aria-labelledby="merchant-how-title"><div className="section-kicker">Built for the operator</div><h2 id="merchant-how-title">A short line is a better experience for everyone.</h2><div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

				<section id="capabilities" className="marketing-section" aria-labelledby="capabilities-title"><div className="section-kicker">One working surface</div><h2 id="capabilities-title">The tools your team uses every day.</h2><div className="categories-grid"><Capability icon={Ic.Clock} title="Outlet hours" copy="Keep availability and open or closed state visible." /><Capability icon={Ic.Tag} title="Services" copy="Organize the menu or services customers request." /><Capability icon={Ic.Activity} title="Live queue" copy="See pending, waiting and called customers as they change." /><Capability icon={Ic.Bar} title="Daily analytics" copy="Review served, missed and waiting activity by outlet." /></div></section>

				<section className="marketing-section"><div className="marketing-callout"><div><div className="section-kicker">Ready when you are</div><h2>Make the next visit easier.</h2><p>Create your business profile and invite customers to use a queue they can understand.</p></div><button className="button-primary" onClick={() => setOpen(true)}>Create your profile <Ic.Arrow /></button></div></section>
				<footer className="marketing-footer"><span>spotly. / business © {new Date().getFullYear()}</span><nav><a href="#how">How it works</a><a href={env.NEXT_PUBLIC_CONSUMER_URL}>For customers</a></nav></footer>
			</main>
			<AuthModal isOpen={open} onClose={() => setOpen(false)} onGoogleAuth={signInWithGoogle} onEmailAuth={async (email, password, mode, name) => mode === "sign-up" ? (!await signUpWithEmail(email, password, name) ? "Check your email to confirm your account, then sign in." : undefined) : signInWithEmail(email, password)} isLoading={loading} title="Set up your business" variant="merchant" />
		</div>
	)
}

function OperatorPreview() {
	return <div className="queue-demo" aria-label="Example merchant queue, not live data"><div className="queue-demo-head"><div><div className="queue-demo-title">Operator view</div><div className="queue-demo-meta">The Corner Table · Main outlet</div></div><span className="status-chip is-live">Open</span></div><div className="queue-demo-list"><QueueRow token="A12" name="Incoming request" detail="Waiting for acceptance" status="Review" /><QueueRow token="A11" name="Currently called" detail="Ready at the counter" status="Called" live /><QueueRow token="A10" name="Next in line" detail="Accepted · 4 min ago" status="Waiting" /></div><div className="queue-demo-meta" style={{ marginTop: 18 }}>A product preview, not live customer data.</div></div>
}

function QueueRow({ token, name, detail, status, live = false }: { token: string; name: string; detail: string; status: string; live?: boolean }) {
	return <div className="queue-demo-row"><span className="queue-token">{token}</span><span className="queue-person"><strong>{name}</strong><small>{detail}</small></span><span className={`status-chip${live ? " is-live" : ""}`}>{status}</span></div>
}

function Capability({ icon: Icon, title, copy }: { icon: ComponentType<{ size?: number }>; title: string; copy: string }) {
	return <article className="category-card"><Icon size={20} /><span><h3>{title}</h3><p>{copy}</p></span></article>
}

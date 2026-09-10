"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ic, ThemeToggle } from "@spotly/ui"
import { ConsumerAuthModal } from "@/components/ConsumerAuthModal"
import { useAuthStore } from "@/store/auth.store"
import { env } from "@/lib/env"

const steps = [
	["01", "Find a business", "Search nearby places and choose the outlet that works for you."],
	["02", "Request a spot", "Send a request. The business accepts it before your place is confirmed."],
	["03", "Follow your turn", "Keep moving through your day and return when the queue calls you."],
] as const

const categories = [
	["Coffee", Ic.Clock, "Coffee shops and quick service"],
	["Health", Ic.Activity, "Clinics and personal care"],
	["Dining", Ic.Store, "Restaurants and walk-ins"],
	["Services", Ic.Grid, "Everyday appointments and errands"],
] as const

export default function LandingPage() {
	const router = useRouter()
	const { user, loading } = useAuthStore()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!loading && user) router.replace("/home")
	}, [loading, router, user])

	const start = () => user ? router.push("/home") : setOpen(true)

	if (loading) return <div className="marketing-page" aria-label="Loading Spotly" />

	return (
		<div className="marketing-page">
			<header className="marketing-header">
				<a href="#top" className="brand-lockup" aria-label="Spotly home">
					<span className="brand-mark"><Ic.Clock size={17} /></span>
					<span className="brand-name">spotly.</span>
				</a>
				<nav className="marketing-nav" aria-label="Primary navigation">
					<a href="#how">How it works</a>
					<a href="#categories">Explore</a>
					<a href={env.NEXT_PUBLIC_MERCHANT_URL}>For businesses</a>
				</nav>
				<div className="marketing-actions">
					<ThemeToggle />
					<button className="button-secondary" onClick={() => setOpen(true)}>Sign in</button>
				</div>
			</header>

			<main id="top" className="marketing-main">
				<section className="marketing-hero" aria-labelledby="consumer-title">
					<div>
						<div className="eyebrow">A calmer way to walk in</div>
						<h1 id="consumer-title">Your day.<br />Your place <span>in line.</span></h1>
						<p>Find a nearby business, request a spot, and follow your turn without standing around. Spotly keeps the queue clear and your day moving.</p>
						<div className="marketing-cta">
							<button className="button-primary" onClick={start}>Find a business <Ic.Arrow /></button>
							<a className="button-secondary" href="#how">How it works</a>
						</div>
					</div>
					<QueuePreview audience="consumer" />
				</section>

				<section id="how" className="marketing-section" aria-labelledby="how-title">
					<div className="section-kicker">Three clear steps</div>
					<h2 id="how-title">More time for what you came to do.</h2>
					<div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
				</section>

				<section id="categories" className="marketing-section" aria-labelledby="category-title">
					<div className="section-kicker">Find your next stop</div>
					<h2 id="category-title">Start with what you need.</h2>
					<div className="categories-grid">{categories.map(([label, Icon, copy]) => <button className="category-card" key={label} onClick={start}><Icon size={20} /><span><h3>{label}</h3><p>{copy}</p></span></button>)}</div>
				</section>

				<section className="marketing-section">
					<div className="marketing-callout"><div><div className="section-kicker">For walk-in businesses</div><h2>Run a better queue.</h2><p>Accept requests, call the next customer, and keep your front desk focused.</p></div><a className="button-primary" href={env.NEXT_PUBLIC_MERCHANT_URL}>For businesses <Ic.Arrow /></a></div>
				</section>

				<footer className="marketing-footer"><span>spotly. © {new Date().getFullYear()}</span><nav><a href="#how">How it works</a><a href={env.NEXT_PUBLIC_MERCHANT_URL}>For businesses</a></nav></footer>
			</main>
			<ConsumerAuthModal isOpen={open} onClose={() => setOpen(false)} title="Continue to Spotly" />
		</div>
	)
}

function QueuePreview({ audience }: { audience: "consumer" }) {
	return <div className="queue-demo" aria-label="Example queue, not live data"><div className="queue-demo-head"><div><div className="queue-demo-title">Example queue</div><div className="queue-demo-meta">The Corner Table · Walk-ins</div></div><span className="status-chip is-live">Open now</span></div><div className="queue-demo-list"><QueueRow token="A12" name="Your spot" detail="Request accepted" status="Waiting" live /><QueueRow token="A11" name="Guest before you" detail="Being called" status="Called" /><QueueRow token="A13" name="Next request" detail="Pending review" status="Pending" /></div><div className="queue-demo-meta" style={{ marginTop: 18 }}>This preview is illustrative, not live activity.</div></div>
}

function QueueRow({ token, name, detail, status, live = false }: { token: string; name: string; detail: string; status: string; live?: boolean }) {
	return <div className="queue-demo-row"><span className="queue-token">{token}</span><span className="queue-person"><strong>{name}</strong><small>{detail}</small></span><span className={`status-chip${live ? " is-live" : ""}`}>{status}</span></div>
}

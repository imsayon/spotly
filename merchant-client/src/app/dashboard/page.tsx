"use client"

import { useEffect, useRef } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore, type ExtendedQueueEntry } from "@/store/queue.store"

export default function MerchantDashboard() {
	const { merchantProfile } = useAuthStore()
	const { add: addToast } = useToasts()
	const store = useQueueStore()
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		store.setToastFn(addToast as any)
		if (!merchantProfile?.id) return
		store.fetchOutlets(merchantProfile.id).then(() => store.connectRealtime())
		pollRef.current = setInterval(() => store.fetchQueue(), 8000)
		return () => { store.disconnectRealtime(); if (pollRef.current) clearInterval(pollRef.current) }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [merchantProfile?.id, addToast])

	const pending = store.entries.filter((entry) => entry.status === "PENDING_ACCEPTANCE")
	const waiting = store.entries.filter((entry) => entry.status === "WAITING")
	const called = store.entries.find((entry) => entry.status === "CALLED")
	const outlet = store.outlets.find((item) => item.id === store.selectedOutletId)

	if (store.loading) return <div className="dashboard-loading" aria-label="Loading dashboard" />
	if (!merchantProfile) return <EmptyState title="Complete your profile" copy="Set up your business before managing a queue." action="Start onboarding" href="/onboarding" />

	return <div className="dashboard-page">
		<header className="dashboard-header">
			<div><div className="section-kicker">Today at a glance</div><h1>{merchantProfile.name}</h1><p>{outlet?.name || "Choose an outlet to begin"} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p></div>
			<div className="dashboard-actions">
				{store.outlets.length > 0 && <label className="outlet-select"><span className="sr-only">Outlet</span><select value={store.selectedOutletId} onChange={(event) => store.setSelectedOutletId(event.target.value)}>{store.outlets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
				<button className={`state-toggle ${store.isOpen ? "is-open" : "is-closed"}`} onClick={store.toggleOpen}><span />{store.isOpen ? "Open" : "Closed"}</button>
			</div>
		</header>

		{store.outlets.length === 0 ? <EmptyState title="No outlets yet" copy="Add your first outlet to start accepting queue requests." action="Add outlet" href="/dashboard/outlets" /> : <>
			<section className="metric-strip" aria-label="Queue summary"><Metric label="Pending review" value={pending.length} hint="Needs a decision" /><Metric label="Waiting" value={waiting.length} hint="Accepted customers" /><Metric label="Now serving" value={called ? `#${called.tokenNumber}` : "—"} hint={called ? "At the counter" : "Queue is clear"} /><Metric label="Connection" value={store.wsConnected ? "Live" : "Polling"} hint="Updates every few seconds" /></section>

			<div className="dashboard-grid">
				<section className="dashboard-panel pending-panel"><PanelHeading title="Requests to review" count={pending.length} copy="Customers stay pending until you accept them." />{pending.length === 0 ? <EmptyPanel copy="No new requests. Your queue is up to date." /> : <div className="request-list">{pending.map((entry) => <RequestRow key={entry.id} entry={entry} onAccept={() => store.acceptEntry(entry.id)} onReject={() => store.rejectEntry(entry.id)} />)}</div>}</section>
				<section className="dashboard-panel called-panel"><PanelHeading title="Currently called" count={called ? 1 : 0} copy="Finish the current visit before calling another customer." />{called ? <div className="called-card"><span className="called-token">#{called.tokenNumber}</span><div><strong>Customer {called.tokenNumber}</strong><p>Called {new Date(called.calledAt || called.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div><button className="button-primary" onClick={() => store.markServed(called.id)}><Ic.Check /> Mark served</button></div> : <EmptyPanel copy="No customer is being called right now." />}</section>
				<section className="dashboard-panel waiting-panel"><PanelHeading title="Waiting queue" count={waiting.length} copy="Accepted customers in order." /><div className="waiting-toolbar"><span>{waiting.length ? `Next up: #${waiting[0].tokenNumber}` : "No accepted customers"}</span><button className="button-primary" disabled={!waiting.length || !!called} onClick={store.callNext}><Ic.Arrow /> Call next</button></div>{waiting.length > 0 && <div className="waiting-list">{waiting.map((entry, index) => <div className="waiting-row" key={entry.id}><span className="queue-token">#{entry.tokenNumber}</span><span><strong>Customer {entry.tokenNumber}</strong><small>Joined {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span><span className="queue-position">{index === 0 ? "Next" : `${index} ahead`}</span></div>)}</div>}</section>
			</div>
		</>}
	</div>
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div> }
function PanelHeading({ title, count, copy }: { title: string; count: number; copy: string }) { return <div className="panel-heading"><div><h2>{title} <span>{count}</span></h2><p>{copy}</p></div></div> }
function EmptyPanel({ copy }: { copy: string }) { return <div className="empty-panel"><Ic.Check size={18} /><span>{copy}</span></div> }
function EmptyState({ title, copy, action, href }: { title: string; copy: string; action: string; href: string }) { return <div className="empty-state"><Ic.Store size={28} /><h1>{title}</h1><p>{copy}</p><a className="button-primary" href={href}>{action}<Ic.Arrow /></a></div> }
function RequestRow({ entry, onAccept, onReject }: { entry: ExtendedQueueEntry; onAccept: () => void; onReject: () => void }) { return <div className="request-row"><span className="queue-token">#{entry.tokenNumber}</span><span className="request-copy"><strong>Customer {entry.tokenNumber}</strong><small>Requested {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span><span className="request-actions"><button className="button-secondary" onClick={onReject}><Ic.X /> Reject</button><button className="button-primary" onClick={onAccept}><Ic.Check /> Accept</button></span></div> }

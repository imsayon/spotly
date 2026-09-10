"use client"

import { useEffect, useRef } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore, type ExtendedQueueEntry } from "@/store/queue.store"

export default function QueueOperatorPage() {
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

	if (store.loading) return <div className="dashboard-loading" aria-label="Loading queue" />
	return <div className="dashboard-page queue-operator-page">
		<header className="dashboard-header"><div><div className="section-kicker">Live operations</div><h1>Queue operator</h1><p>{store.wsConnected ? "Live updates connected" : "Polling for updates"} · Keep one customer moving at a time.</p></div><div className="dashboard-actions">{store.outlets.length > 0 && <label className="outlet-select"><span className="sr-only">Outlet</span><select value={store.selectedOutletId} onChange={(event) => store.setSelectedOutletId(event.target.value)}>{store.outlets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<button className={`state-toggle ${store.isOpen ? "is-open" : "is-closed"}`} onClick={store.toggleOpen}><span />{store.isOpen ? "Open" : "Closed"}</button></div></header>
		<section className="metric-strip"><Metric label="Pending" value={pending.length} hint="Needs approval" /><Metric label="Waiting" value={waiting.length} hint="Accepted" /><Metric label="Called" value={called ? `#${called.tokenNumber}` : "—"} hint="Current visit" /><Metric label="Next action" value={called ? "Finish" : waiting.length ? "Call" : "Idle"} hint="Operator state" /></section>
		<div className="dashboard-grid">
			<section className="dashboard-panel pending-panel"><PanelHeading title="Pending acceptance" count={pending.length} copy="Approve a request before it enters the live queue." />{pending.length ? <div className="request-list">{pending.map((entry) => <RequestRow key={entry.id} entry={entry} onAccept={() => store.acceptEntry(entry.id)} onReject={() => store.rejectEntry(entry.id)} />)}</div> : <EmptyPanel copy="No requests are waiting for approval." />}</section>
			<section className="dashboard-panel called-panel"><PanelHeading title="Currently called" count={called ? 1 : 0} copy="The called customer should be served before the next call." />{called ? <div className="called-card"><span className="called-token">#{called.tokenNumber}</span><div><strong>Customer {called.tokenNumber}</strong><p>Please serve this customer at the counter.</p></div><button className="button-primary" onClick={() => store.markServed(called.id)}><Ic.Check /> Mark served</button></div> : <EmptyPanel copy="The counter is ready for the next customer." />}</section>
			<section className="dashboard-panel waiting-panel"><PanelHeading title="Waiting queue" count={waiting.length} copy="Accepted customers ordered by arrival." /><div className="waiting-toolbar"><span>{waiting.length ? `Next up is #${waiting[0].tokenNumber}` : "No one is waiting"}</span><button className="button-primary" disabled={!waiting.length || !!called} onClick={store.callNext}><Ic.Arrow /> Call next</button></div><div className="waiting-list">{waiting.map((entry, index) => <div className="waiting-row" key={entry.id}><span className="queue-token">#{entry.tokenNumber}</span><span><strong>Customer {entry.tokenNumber}</strong><small>Joined {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span><span className="queue-position">{index ? `${index} ahead` : "Next"}</span></div>)}</div></section>
		</div>
	</div>
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div> }
function PanelHeading({ title, count, copy }: { title: string; count: number; copy: string }) { return <div className="panel-heading"><div><h2>{title} <span>{count}</span></h2><p>{copy}</p></div></div> }
function EmptyPanel({ copy }: { copy: string }) { return <div className="empty-panel"><Ic.Check size={18} /><span>{copy}</span></div> }
function RequestRow({ entry, onAccept, onReject }: { entry: ExtendedQueueEntry; onAccept: () => void; onReject: () => void }) { return <div className="request-row"><span className="queue-token">#{entry.tokenNumber}</span><span className="request-copy"><strong>Customer {entry.tokenNumber}</strong><small>Requested {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span><span className="request-actions"><button className="button-secondary" onClick={onReject}><Ic.X /> Reject</button><button className="button-primary" onClick={onAccept}><Ic.Check /> Accept</button></span></div> }

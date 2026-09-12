'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Clock, Coffee, Compass, Heart, MapPin, Megaphone, Search, Settings, Store, Ticket, User, X, BarChart3, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'
import { initialQueue, MAIN_OUTLET_ID, NORTH_OUTLET_ID, queueForOutlet, transition, type Action, type Entry, type Status } from './queue'
import './collection.css'

type Role = 'consumer' | 'merchant'
type Scenario = 'populated' | 'empty' | 'loading' | 'offline' | 'error'
type OutletName = 'Main outlet' | 'North outlet'
const places = [
  { id: 1, name: 'Corner House', category: 'Coffee', address: '12 Main Street', waiting: 4, icon: Coffee, description: 'Coffee, good conversation, and a place in the neighbourhood.' },
  { id: 2, name: 'Northside Studio', category: 'Services', address: '8 North Road', waiting: 2, icon: Layers, description: 'A little time for yourself, close to home.' },
  { id: 3, name: 'Riverside Care', category: 'Health', address: '24 River Road', waiting: 0, icon: Heart, description: 'Local care, with a clearer way to follow your turn.' },
]
const statusText: Record<Status, string> = { PENDING_ACCEPTANCE: 'Awaiting acceptance', WAITING: 'Waiting', CALLED: 'Your turn', SERVED: 'Visit complete', MISSED: 'Request ended', CANCELLED: 'You left the queue' }
const number = (tokenNumber: number) => String(tokenNumber).padStart(3, '0')
const outletIdFor = (name: OutletName) => name === 'Main outlet' ? MAIN_OUTLET_ID : NORTH_OUTLET_ID

export function InterfaceCollection({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole)
  const [screen, setScreen] = useState(initialRole === 'consumer' ? 'Discover' : 'Queue')
  const [scenario, setScenario] = useState<Scenario>('populated')
  const [queue, setQueue] = useState<Entry[]>(initialQueue)
  const [outlet, setOutlet] = useState<OutletName>('Main outlet')
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(1)
  const [saved, setSaved] = useState<number[]>([1])
  const [myId, setMyId] = useState<string | null>(initialQueue.find(e => e.tokenNumber === 45)?.id || null)
  const [myPlace, setMyPlace] = useState(1)
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset' | 'sent'>('signin')
  const [service, setService] = useState({ name: 'Consultation', price: '150', available: true })
  const [editingService, setEditingService] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const [confirmation, setConfirmation] = useState<{ action: Action; id?: string; text: string } | null>(null)
  const pending = queue.filter(e => e.status === 'PENDING_ACCEPTANCE')
  const waiting = queue.filter(e => e.status === 'WAITING')
  const called = queue.find(e => e.status === 'CALLED')
  const current = queue.find(e => e.id === myId)
  const place = places.find(p => p.id === selected)!
  const ticketPlace = places.find(p => p.id === myPlace)!
  const locked = scenario === 'offline' || scenario === 'error' || scenario === 'loading'
  const nav = role === 'consumer' ? ['Discover', 'Your turn', 'Saved', 'Account'] : ['Queue', 'Outlets', 'Services', 'Activity', 'Settings']
  const icons = role === 'consumer' ? [Compass, Ticket, Heart, User] : [Layers, Store, Coffee, BarChart3, Settings]

  function navigate(next: string) { setScreen(next); setScenario('populated'); setMessage('') }
  function act(action: Action, id?: string) {
    if (locked) return
    setQueue(q => transition(q, action, id))
    setMessage(action === 'call' ? 'Next customer called in the preview.' : 'Sample queue updated.')
  }
  function confirm(action: Action, id: string | undefined, text: string) {
    setConfirmation({ action, id, text }); dialog.current?.showModal()
  }
  function switchRole(next: Role) { setRole(next); navigate(next === 'consumer' ? 'Discover' : 'Queue') }
  function reset(nextOutlet: OutletName = outlet) {
    const sample = queueForOutlet(outletIdFor(nextOutlet))
    setOutlet(nextOutlet)
    setQueue(sample)
    setMyId(sample.find(e => e.tokenNumber === 45)?.id || null)
    setMyPlace(nextOutlet === 'Main outlet' ? 1 : 2)
    setScenario('populated')
    setMessage('Sample data reset.')
    setOpen(true)
  }
  function join() {
    if (current && ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'].includes(current.status)) {
      setMessage('You already have an active place. Finish or leave it before requesting another.'); setScreen('Your turn'); return
    }
    const tokenNumber = Math.max(0, ...queue.map(e => e.tokenNumber)) + 1
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${outletIdFor(outlet)}-preview-${tokenNumber}`
    setQueue(q => [...q, { id, outletId: outletIdFor(outlet), tokenNumber, status: 'PENDING_ACCEPTANCE', minutes: 0 }]); setMyId(id); setMyPlace(selected); navigate('Your turn')
  }
  const empty = (title: string, description: string) => <div className="ic-empty"><Ticket size={32} /><h2>{title}</h2><p>{description}</p><button className="ic-secondary" onClick={() => { reset(); navigate(role === 'consumer' ? 'Discover' : 'Queue') }}>Restore sample data <ArrowRight size={16} /></button></div>

  function queueView() {
    return <><div className="ic-heading"><div><span className="ic-kicker">The front desk</span><h1>Keep the day moving.</h1><p>One clear view of who needs you next.</p></div><span className="ic-date">Friday, 11 September 2026</span></div>
      <div className="ic-service-band"><div><span className="ic-label">Currently called</span><strong className="ic-called">{called ? number(called.tokenNumber) : '—'}</strong></div><div className="ic-service-copy"><span className="ic-status">{called ? 'Ready at the counter' : 'Ready for the next visit'}</span><p>{called ? 'Complete this visit before calling the next customer.' : 'Call the first accepted customer when you are ready.'}</p></div><div className="ic-service-actions">{called ? <><button className="ic-primary" disabled={locked} onClick={() => act('serve', called.id)}>Mark served <Check size={16} /></button><button className="ic-text" disabled={locked} onClick={() => confirm('miss', called.id, `Mark token ${number(called.tokenNumber)} as missed?`)}>Mark missed</button></> : <button className="ic-primary" disabled={locked || !waiting.length} onClick={() => act('call')}>Call next <Megaphone size={16} /></button>}</div></div>
      <div className="ic-queue-columns"><section><div className="ic-section-title"><h2>New requests <span>{pending.length}</span></h2><span className="ic-label">Oldest first</span></div>{pending.length ? pending.map(e => <div className="ic-queue-row" key={e.id}><strong>{number(e.tokenNumber)}</strong><span>Requested {e.minutes} min ago</span><div className="ic-row-actions"><button className="ic-primary ic-small" disabled={locked} onClick={() => act('accept', e.id)}>Accept<span className="ic-sr"> token {number(e.tokenNumber)}</span></button><button className="ic-text" disabled={locked} onClick={() => confirm('decline', e.id, `Decline token ${number(e.tokenNumber)}? This ends their request.`)}>Decline<span className="ic-sr"> token {number(e.tokenNumber)}</span></button></div></div>) : <p className="ic-inline-empty">No requests need a decision.</p>}</section>
        <section><div className="ic-section-title"><h2>Waiting <span>{waiting.length}</span></h2><Clock size={17} /></div>{waiting.length ? waiting.map((e, i) => <div className="ic-queue-row ic-waiting" key={e.id}><strong>{number(e.tokenNumber)}</strong><span>Joined {e.minutes} min ago</span><small>{i === 0 ? 'Next' : `${i} ahead`}</small></div>) : <p className="ic-inline-empty">No accepted customers are waiting.</p>}<div className="ic-next"><span>{called ? 'Finish the current visit first.' : 'The next customer is ready to be called.'}</span><button className="ic-secondary" disabled={locked || !!called || !waiting.length} onClick={() => act('call')}>Call next <ArrowRight size={16} /></button></div></section></div>
      <p className="ic-footnote">Sample queue · Changes are local to this preview</p></>
  }

  function discovery() {
    const visible = places.filter(p => (screen !== 'Saved' || saved.includes(p.id)) && (category === 'All' || p.category === category) && `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()))
    return <><div className="ic-heading"><div><span className="ic-kicker">Good days happen locally</span><h1>{screen === 'Saved' ? 'Your familiar places.' : 'Find a place. Spend time better.'}</h1><p>Explore local businesses, request a spot, and follow your turn.</p></div></div>
      <div className="ic-discovery-tools"><label className="ic-search"><Search size={18} /><input aria-label="Find a place or service" placeholder="Find a place or service" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="ic-categories" aria-label="Categories">{['All', 'Coffee', 'Health', 'Dining', 'Services'].map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
      <div className="ic-discovery-grid"><section className="ic-place-list">{visible.length ? visible.map(p => <div className={`ic-place-row ${selected === p.id ? 'selected' : ''}`} key={p.id}><div className="ic-place-icon"><p.icon size={25} strokeWidth={1.5} /></div><button className="ic-place-name" onClick={() => setSelected(p.id)}><small>{p.category}</small><strong>{p.name}</strong><span><MapPin size={13} />{p.address}</span></button><div className="ic-place-status"><span className="ic-status">Accepting requests</span><small>{p.waiting} waiting · Sample</small></div><button className="ic-icon-button" aria-label={`${saved.includes(p.id) ? 'Unsave' : 'Save'} ${p.name}`} aria-pressed={saved.includes(p.id)} onClick={() => setSaved(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id])}><Heart size={19} fill={saved.includes(p.id) ? 'currentColor' : 'none'} /></button></div>) : empty('No matching places.', 'Try a different category or search term.')}</section>
        <aside className="ic-place-detail"><div className="ic-detail-icon"><place.icon size={48} strokeWidth={1} /></div><span className="ic-kicker">{place.category}</span><h2>{place.name}</h2><p><MapPin size={15} /> {place.address} · Main outlet</p><p>{place.description}</p><div className="ic-detail-status"><span className="ic-status">Accepting requests</span><span>{place.waiting} waiting</span></div><button className="ic-primary" disabled={locked} onClick={join}>Request a spot <ArrowRight size={16} /></button><small>The business must accept your request before your place is confirmed.</small></aside></div></>
  }

  function tracker() {
    if (!current) return empty('Your day is wide open.', 'Find a local business to request your first spot.')
    const live = ['PENDING_ACCEPTANCE', 'WAITING', 'CALLED'].includes(current.status)
    return <div className="ic-ticket-page"><span className="ic-kicker">Your turn</span><div className="ic-ticket-merchant"><Store size={21} /><div><strong>{ticketPlace.name}</strong><span>{outlet} · {ticketPlace.address}</span></div></div><h1>{current.status === 'WAITING' ? 'Your place is confirmed.' : current.status === 'CALLED' ? 'They’re ready for you.' : current.status === 'PENDING_ACCEPTANCE' ? 'Your request is with the business.' : statusText[current.status]}</h1><div className="ic-ticket"><span>Your number</span><strong>{number(current.tokenNumber)}</strong><h2>{statusText[current.status]}</h2>{current.status === 'WAITING' && <p>{Math.max(0, waiting.findIndex(e => e.id === current.id))} waiting ahead{called ? ' · 1 customer called' : ''}</p>}{current.status === 'PENDING_ACCEPTANCE' && <p>Your place is not confirmed yet. Requests expire after ten minutes without acceptance.</p>}{current.status === 'CALLED' && <p>Please go to the counter and show your number.</p>}</div><div className="ic-ticket-info"><AlertCircle size={18} /><p>{live ? 'Keep this page open to follow updates. This collection simulates the queue.' : 'This request is no longer active.'}</p></div>{live ? <button className="ic-text ic-leave" disabled={locked} onClick={() => confirm('leave', current.id, 'Leave this queue? Your place cannot be restored.')}>Leave queue</button> : <button className="ic-primary" onClick={() => navigate('Discover')}>Find a place <ArrowRight size={16} /></button>}<div className="ic-preview-note">To test the journey, switch to Merchant in the preview toolbar and operate the same sample queue.</div></div>
  }

  function auth() {
    return <div className="ic-auth-layout"><section><span className="ic-kicker">Spotly {role === 'merchant' ? 'for business' : 'for your day'}</span><h1>{role === 'consumer' ? <>Good places.<br />A little more time.</> : <>A calmer front desk<br />starts here.</>}</h1><p>{role === 'consumer' ? 'Your favourite places, with a clearer way to wait.' : 'Requests, waiting customers, and the next visit. All in one place.'}</p></section><form className="ic-auth-form" onSubmit={e => { e.preventDefault(); if (authMode === 'reset' || authMode === 'signup') setAuthMode('sent'); else setMessage('Preview sign-in complete. No credentials were transmitted.'); }}><Store size={24} /><h2>{authMode === 'sent' ? 'Check your email' : authMode === 'signup' ? 'Create your account' : authMode === 'reset' ? 'Reset your password' : role === 'consumer' ? 'Sign in to request your spot' : 'Welcome to your front desk'}</h2>{authMode === 'sent' ? <><p>Preview confirmation only. No email was sent.</p><button type="button" className="ic-secondary" onClick={() => setAuthMode('signin')}>Back to sign in</button></> : <>{authMode !== 'reset' && <><button type="button" className="ic-secondary" onClick={() => setMessage('Google sign-in belongs to the production auth flow. This preview sends no requests.')}>Continue with Google <ArrowRight size={15} /></button><div className="ic-divider">or use email</div></>}<label>Email<input type="email" required autoComplete="off" placeholder="you@example.com" /></label>{authMode !== 'reset' && <label>Password<input type="password" required minLength={8} autoComplete="off" placeholder="At least 8 characters" /></label>}{authMode === 'signin' && <button type="button" className="ic-text" onClick={() => setAuthMode('reset')}>Forgot password?</button>}<button className="ic-primary" type="submit">{authMode === 'reset' ? 'Send reset link' : authMode === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight size={16} /></button><button type="button" className="ic-text" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'New here? Create an account' : 'Back to sign in'}</button></>}<small>Use fictional details. This is a design preview.</small></form></div>
  }

  function settingsView() {
    return <div className="ic-form-page"><span className="ic-kicker">{role === 'merchant' ? 'Your business' : 'Your account'}</span><h1>A few useful details.</h1><p>Keep your information clear and up to date.</p><form onSubmit={e => { e.preventDefault(); setMessage('Details saved in this preview only.') }}><label>{role === 'merchant' ? 'Business name' : 'Your name'}<input required defaultValue={role === 'merchant' ? 'Corner House' : 'Sample customer'} /></label><label>Email<input type="email" required defaultValue="hello@example.com" /></label><label>{role === 'merchant' ? 'Business address' : 'Area'}<input required defaultValue={role === 'merchant' ? '12 Main Street' : 'City centre'} /></label><button className="ic-primary">Save details <Check size={16} /></button></form><div className="ic-settings-note"><h2>Your Spotly experience</h2><p>{role === 'merchant' ? 'Jade brings a clear, calm workspace to your front desk.' : 'Terracotta keeps your places and your turn warm and readable.'}</p><button className="ic-text" onClick={() => navigate('Sign in')}>Preview sign-in <ArrowRight size={15} /></button></div></div>
  }

  function services() {
    return <><div className="ic-heading"><div><span className="ic-kicker">{outlet}</span><h1>What people come for.</h1><p>Your menu or services, organised simply.</p></div></div><section className="ic-services"><div className="ic-section-title"><h2>General services</h2></div><div className="ic-service-item"><Coffee size={22} /><div><strong>{service.name}</strong><p>₹{Number(service.price).toFixed(2)}</p></div><label className="ic-checkbox"><input type="checkbox" checked={service.available} onChange={e => setService({ ...service, available: e.target.checked })} />Available</label><button className="ic-secondary" onClick={() => setEditingService(!editingService)}>{editingService ? 'Close editor' : 'Edit service'}</button></div>{editingService && <form className="ic-inline-form" onSubmit={e => { e.preventDefault(); setEditingService(false); setMessage('Sample service updated.') }}><label>Service name<input required value={service.name} onChange={e => setService({ ...service, name: e.target.value })} /></label><label>Price (INR)<input type="number" min="0" step="0.01" required value={service.price} onChange={e => setService({ ...service, price: e.target.value })} /></label><button className="ic-primary">Done <Check size={16} /></button></form>}</section><p className="ic-footnote">Menu prices describe services. This preview does not take payments.</p></>
  }

  function outlets() {
    return <><div className="ic-heading"><div><span className="ic-kicker">Corner House</span><h1>Every place, in view.</h1><p>Select a location to open its sample workspace.</p></div></div><div className="ic-outlets">{(['Main outlet', 'North outlet'] as OutletName[]).map((name, i) => <button className="ic-outlet" key={name} onClick={() => { reset(name); navigate('Queue') }}><Store size={28} strokeWidth={1.5} /><span className="ic-status">Accepting requests</span><h2>{name}</h2><p>{i ? '8 North Road' : '12 Main Street'}</p><span className="ic-outlet-link">Open workspace <ArrowRight size={18} /></span></button>)}</div><p className="ic-footnote">Each sample outlet has distinct IDs and queue data. Live outlet data is not connected.</p></>
  }

  function activity() {
    const completed = queue.filter(e => ['SERVED', 'MISSED', 'CANCELLED'].includes(e.status))
    return <><div className="ic-heading"><div><span className="ic-kicker">Today · {outlet}</span><h1>The shape of your day.</h1><p>Clear counts, grounded in the sample queue.</p></div></div><div className="ic-metrics">{[['Requests', queue.length], ['Served', queue.filter(e => e.status === 'SERVED').length], ['Not completed', queue.filter(e => ['MISSED', 'CANCELLED'].includes(e.status)).length], ['Active', pending.length + waiting.length + (called ? 1 : 0)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="ic-section-title"><h2>Completed activity</h2><span className="ic-label">This preview session</span></div>{completed.length ? <table className="ic-table"><thead><tr><th>Token</th><th>Outcome</th></tr></thead><tbody>{completed.map(e => <tr key={e.id}><td>{number(e.tokenNumber)}</td><td>{statusText[e.status]}</td></tr>)}</tbody></table> : <div className="ic-inline-empty">Complete a visit in Queue to see it here.</div>}<p className="ic-footnote">No forecasts or invented efficiency scores. Production activity will use the outlet’s local day.</p></>
  }

  function landing() {
    return <div className="ic-landing"><span className="ic-kicker">{role === 'consumer' ? 'Real places. A little more time.' : 'A clearer front desk.'}</span><h1>{role === 'consumer' ? <>A little less waiting.<br />A little more day.</> : <>Good places.<br />Better flow.</>}</h1><p>{role === 'consumer' ? 'Find a local business, request a place, and follow your turn. Make room for what matters.' : 'Keep requests, waiting customers, and the current visit in one thoughtful workspace.'}</p><button className="ic-primary" onClick={() => navigate(role === 'consumer' ? 'Discover' : 'Queue')}>{role === 'consumer' ? 'Find a place' : 'Try the sample queue'}<ArrowRight size={18} /></button><div className="ic-story">{[['01', 'Request', 'Send your request to the business.'], ['02', 'Accepted', 'Your place is confirmed.'], ['03', 'Called', 'Check your turn and go to the counter.']].map(([n, title, copy]) => <div key={n}><span>{n}</span><h2>{title}</h2><p>{copy}</p></div>)}</div><button className="ic-text" onClick={() => switchRole(role === 'consumer' ? 'merchant' : 'consumer')}>{role === 'consumer' ? 'Spotly for businesses' : 'Explore the customer experience'}<ArrowRight size={16} /></button></div>
  }

  return <div className={`ic-collection ic-${role}`}>
    <div className="ic-gallery-bar"><span><strong>Interface collection</strong> <span className="ic-gallery-sub">/ Sample data · No live writes</span></span><div><label className="ic-sr" htmlFor="preview-role">Preview role</label><select id="preview-role" value={role} onChange={e => switchRole(e.target.value as Role)}><option value="consumer">Consumer · Terracotta</option><option value="merchant">Merchant · Jade</option></select><label className="ic-sr" htmlFor="preview-state">Preview state</label><select id="preview-state" value={scenario} onChange={e => setScenario(e.target.value as Scenario)}>{['populated', 'empty', 'loading', 'offline', 'error'].map(s => <option key={s} value={s}>{s}</option>)}</select><button onClick={() => navigate('Landing')}>Landing</button><button onClick={() => navigate('Sign in')}>Auth</button><button onClick={() => reset()}>Reset</button></div></div>
    <div className="ic-shell"><nav className="ic-nav" aria-label="Product navigation"><button className="ic-logo" onClick={() => navigate('Landing')}><Ticket size={26} strokeWidth={1.8} />Spotly<span>{role === 'merchant' ? 'Business' : ''}</span></button><div className="ic-nav-items">{nav.map((name, i) => { const Icon = icons[i]; return <button key={name} aria-current={screen === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={19} strokeWidth={1.6} /><span>{name}</span></button> })}</div>{role === 'merchant' && <div className="ic-nav-end"><span className="ic-nav-dash" /><p>Good places.<br />More people<br />together.</p></div>}</nav>
      <div className="ic-workspace">{role === 'merchant' && <header className="ic-topbar"><span><Store size={17} /><strong>Corner House</strong></span><select aria-label="Sample outlet" value={outlet} onChange={e => reset(e.target.value as OutletName)}><option>Main outlet</option><option>North outlet</option></select><button className="ic-open" aria-pressed={open} disabled={locked} onClick={() => { setOpen(!open); setMessage(open ? 'Sample outlet paused for new requests.' : 'Sample outlet accepting requests.') }}><span className={open ? 'ic-dot' : 'ic-dot paused'} />{open ? 'Accepting requests' : 'Requests paused'}<ChevronDown size={14} /></button></header>}
        <main className="ic-main" id="collection-main"><div aria-live="polite" className={message ? 'ic-message' : 'ic-message-empty'}>{message && <><CheckCircle2 size={17} /><span>{message}</span><button className="ic-icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}><X size={16} /></button></>}</div>
          {(scenario === 'offline' || scenario === 'error') && <div className="ic-warning" role="alert"><AlertCircle size={20} /><div><strong>{scenario === 'offline' ? 'Updates are paused.' : 'We couldn’t refresh this view.'}</strong><p>Showing the last sample snapshot. Actions are disabled until you retry.</p></div><button className="ic-secondary" onClick={() => setScenario('populated')}>Retry</button></div>}
          {scenario === 'loading' ? <div className="ic-loading" role="status"><span>Loading sample view…</span>{[1, 2, 3, 4].map(i => <div key={i} />)}<button className="ic-secondary" onClick={() => setScenario('populated')}>Finish loading</button></div> : scenario === 'empty' ? empty('Nothing here yet.', 'This is how the interface handles a genuinely empty result.') : screen === 'Landing' ? landing() : screen === 'Sign in' ? auth() : screen === 'Queue' ? queueView() : screen === 'Discover' || screen === 'Saved' ? discovery() : screen === 'Your turn' ? tracker() : screen === 'Outlets' ? outlets() : screen === 'Services' ? services() : screen === 'Activity' ? activity() : settingsView()}
        </main></div></div>
    <dialog ref={dialog} className="ic-confirm"><form method="dialog"><button className="ic-icon-button ic-dialog-close" aria-label="Close confirmation"><X size={18} /></button><AlertCircle size={28} /><h2>Before you continue</h2><p>{confirmation?.text}</p><div className="ic-confirm-actions"><button className="ic-secondary">Keep it</button><button className="ic-primary" onClick={() => { if (confirmation) act(confirmation.action, confirmation.id) }}>Confirm</button></div></form></dialog>
  </div>
}

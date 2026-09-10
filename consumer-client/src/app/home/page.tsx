"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Ic, useToasts } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { useLiveLocation } from "@/lib/useLiveLocation"

const categories = ["All", "Coffee", "Health", "Dining", "Services"]

export default function ConsumerHome() {
	const router = useRouter()
	const { user, profile } = useAuthStore()
	const { add: addToast } = useToasts()
	const { location, label: locationLabel, isDenied, requestLocation } = useLiveLocation({ prompt: true })
	const [merchants, setMerchants] = useState<any[]>([])
	const [search, setSearch] = useState("")
	const [category, setCategory] = useState("All")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			try {
				const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : ""
				const response = await api.get(`/merchant${params}`)
				setMerchants(response.data.data || [])
			} catch { addToast("Could not load businesses", "error") }
			finally { setLoading(false) }
		}
		load()
	}, [addToast, location])

	const visible = useMemo(() => merchants.filter((merchant) => {
		const text = `${merchant.name || ""} ${merchant.category || ""}`.toLowerCase()
		return (!search || text.includes(search.toLowerCase())) && (category === "All" || text.includes(category.toLowerCase()))
	}), [category, merchants, search])
	const name = profile?.name || user?.email?.split("@")[0] || "there"

	return <div className="consumer-home-page">
		<header className="consumer-home-heading"><div><div className="section-kicker">Your nearby queue</div><h1>Good to see you, {name.split(" ")[0]}.</h1><p><Ic.MapPin /> {locationLabel || "Location unavailable"}</p></div><button className="home-avatar" onClick={() => router.push("/home/profile")} aria-label="Open profile">{name[0]?.toUpperCase()}</button></header>
		{isDenied && <div className="location-notice"><span><Ic.MapPin /> Location access is off. Results may not be nearby.</span><button onClick={requestLocation}>Retry</button></div>}
		<section className="consumer-search" aria-label="Find a business"><div className="consumer-search-input"><Ic.Search /><input aria-label="Search businesses" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search businesses or services" />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><Ic.X /></button>}</div><div className="category-tabs" role="tablist">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></section>
		<section className="consumer-results" aria-live="polite"><div className="results-heading"><h2>{category === "All" ? "Businesses near you" : category}</h2><span>{visible.length} places</span></div>{loading ? <div className="consumer-empty">Loading nearby businesses…</div> : visible.length === 0 ? <div className="consumer-empty"><Ic.Store /><strong>No businesses match that search.</strong><span>Try another category or search term.</span></div> : <div className="merchant-grid">{visible.map((merchant) => <button className="merchant-card" key={merchant.id} onClick={() => router.push(`/merchant?id=${encodeURIComponent(merchant.id)}`)}><div className="merchant-card-top"><span className="merchant-avatar">{merchant.name?.[0]?.toUpperCase() || "S"}</span><span className="availability"><span /> {merchant.outlets?.some((outlet: any) => outlet.isActive) ? "Open" : "Check hours"}</span></div><div><h3>{merchant.name}</h3><p>{merchant.category || "General services"}</p><small>{merchant.address || "Address available after selection"}</small></div><span className="merchant-card-link">View details <Ic.Arrow /></span></button>)}</div>}</section>
	</div>
}

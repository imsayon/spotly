"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, animeReveal, Ic, motionEnabled, useToasts } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { useLiveLocation } from "@/lib/useLiveLocation";
import api from "@/lib/api";
import type { DiscoveryMapOutlet } from "@/components/MapDiscovery";

const MapDiscovery = dynamic(() => import("@/components/MapDiscovery"), {
  ssr: false,
  loading: () => <div className="consumer-map-loading">Loading map…</div>,
});

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="consumer-profile-map-loading">Loading map…</div>,
});

type DiscoveryMode = "nearby" | "viewport" | "global";
type DiscoveryBounds = { north: number; south: number; east: number; west: number };
type OutletResult = DiscoveryMapOutlet & { openTime?: string | null; closeTime?: string | null };

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

function formatDistance(distanceMeters?: number | null) {
  if (!Number.isFinite(distanceMeters)) return null;
  return distanceMeters! < 1000
    ? `${Math.round(distanceMeters!)} m away`
    : `${(distanceMeters! / 1000).toFixed(1)} km away`;
}

function resultHref(outlet: OutletResult) {
  return `/merchant?id=${encodeURIComponent(outlet.merchantId)}&outletId=${encodeURIComponent(outlet.id)}`;
}

export default function ConsumerHome() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { add } = useToasts();
  const {
    location,
    requestLocation,
    isDenied,
    permissionStatus,
    error: locationError,
    loading: locationLoading,
  } = useLiveLocation({ prompt: true });
  const [outlets, setOutlets] = useState<OutletResult[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [mode, setMode] = useState<DiscoveryMode>("nearby");
  const [selectedId, setSelectedId] = useState("");
  const [manualCenter, setManualCenter] = useState<[number, number] | null>(null);
  const [manualLabel, setManualLabel] = useState("");
  const [bounds, setBounds] = useState<DiscoveryBounds | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickerCenter, setPickerCenter] = useState<[number, number]>(INDIA_CENTER);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState<Array<{ label: string; latitude: number; longitude: number }>>([]);
  const [searchingAreas, setSearchingAreas] = useState(false);
  const [areaSearchError, setAreaSearchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const deviceCenter: [number, number] | null = location
    ? [location.latitude, location.longitude]
    : null;
  const activeCenter = manualCenter || deviceCenter;
  const activeCenterKey = activeCenter?.join(",") || "none";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setCategory(params.get("category") || "All");
    setView(params.get("view") === "map" ? "map" : "list");
    setMode(params.get("scope") === "global" ? "global" : "nearby");
    setHydrated(true);
  }, []);

  const categoryOptions = useMemo(() => {
    const fromResults = outlets
      .map((outlet) => outlet.merchant.category?.trim())
      .filter((item): item is string => Boolean(item));
    return ["All", ...Array.from(new Set(fromResults))];
  }, [outlets]);

  useEffect(() => {
    if (hydrated && category !== "All" && categoryOptions.length > 1 && !categoryOptions.includes(category)) {
      setCategory("All");
    }
  }, [category, categoryOptions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    if (view === "map") params.set("view", "map");
    if (mode === "global") params.set("scope", "global");
    const next = params.toString() ? `/home?${params.toString()}` : "/home";
    window.history.replaceState(null, "", next);
  }, [category, hydrated, mode, query, view]);

  useEffect(() => {
    if (!hydrated) return;
    const search = query.trim();
    if (mode === "nearby" && !activeCenter) {
      setOutlets([]);
      setLoading(false);
      return;
    }
    if (mode === "global" && !search) {
      setOutlets([]);
      setLoading(false);
      return;
    }
    if (mode === "viewport" && !bounds) return;

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const params: Record<string, string | number> = {
      mode,
      limit: 50,
    };
    if (search) params.q = search;
    if (category !== "All") params.category = category;
    if (mode === "nearby" && activeCenter) {
      params.lat = activeCenter[0];
      params.lng = activeCenter[1];
    }
    if (mode === "viewport" && bounds) Object.assign(params, bounds);

    api
      .get("/outlet/discover", { params, signal: controller.signal })
      .then((response) => {
        const data = response.data.data;
        setOutlets((data?.items || []) as OutletResult[]);
      })
      .catch((requestError) => {
        if (requestError?.code === "ERR_CANCELED") return;
        setError(true);
        add("Places could not be loaded", "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activeCenterKey, add, bounds, category, hydrated, mode, query, reloadNonce]);

  const openAreaPicker = useCallback(() => {
    setPickerCenter(activeCenter || INDIA_CENTER);
    setShowLocationPicker(true);
  }, [activeCenter]);

  const chooseManualLocation = useCallback((latitude: number, longitude: number, address?: string) => {
    setManualCenter([latitude, longitude]);
    setManualLabel(address || "Selected area");
    setMode("nearby");
    setBounds(null);
    setSelectedId("");
    setShowLocationPicker(false);
    add("Discovery area updated", "success");
  }, [add]);

  const useDeviceLocation = useCallback(() => {
    setManualCenter(null);
    setManualLabel("");
    setMode("nearby");
    setBounds(null);
    setSelectedId("");
    setShowLocationPicker(false);
    requestLocation();
  }, [requestLocation]);

  const searchAreas = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = areaQuery.trim();
    if (search.length < 2) {
      setAreaSearchError("Enter a city, neighborhood, or address");
      return;
    }
    setSearchingAreas(true);
    setAreaSearchError("");
    try {
      const response = await api.get("/location/search", { params: { q: search } });
      setAreaResults(response.data.data?.items || []);
    } catch {
      setAreaSearchError("That place could not be found. Try a more specific search.");
      setAreaResults([]);
    } finally {
      setSearchingAreas(false);
    }
  }, [areaQuery]);

  const exploreEverywhere = useCallback(() => {
    setMode((current) => current === "global" ? "nearby" : "global");
    setBounds(null);
    setSelectedId("");
  }, []);

  const handleBoundsChange = useCallback((next: DiscoveryBounds) => {
    setBounds(next);
    setMode("viewport");
    setSelectedId("");
  }, []);

  const selected = outlets.find((outlet) => outlet.id === selectedId) || null;
  const locationLabel = manualLabel || location?.label || profile?.location || "Choose your area";
  const locationSource = manualCenter ? "Selected area" : location ? "Current location" : "Location needed";
  const center = activeCenter || INDIA_CENTER;

  useEffect(() => {
    const page = pageRef.current;
    if (!page || !motionEnabled()) return;
    const rows = animeReveal(page.querySelectorAll<HTMLElement>(".consumer-place-row"), {
      translateY: [18, 0],
      scale: [0.985, 1],
      duration: 520,
      delay: (_element, index) => Math.min((index ?? 0) * 42, 280),
    });
    return () => {
      rows?.revert();
    };
  }, [loading, error, mode, category, query, view, outlets.length]);

  useEffect(() => {
    const selectedElement = pageRef.current?.querySelector<HTMLElement>(`[data-outlet-id="${selectedId}"]`);
    if (!selectedElement || !motionEnabled()) return;
    const animation = animate(selectedElement, {
      translateX: [8, 0],
      borderColor: ["var(--border)", "var(--brand)"],
      duration: 300,
      ease: "out(4)",
    });
    return () => {
      animation.revert();
    };
  }, [selectedId]);

  return (
    <div ref={pageRef} className="consumer-page discovery-page">
      <header className="consumer-page-heading discovery-heading">
        <div className="discovery-heading-copy">
          <div className="consumer-kicker">Discover nearby</div>
          <h1 className="consumer-editorial">A calmer way to walk in.</h1>
          <p>Find a useful place around you, see the exact outlet, and request a spot when you are ready.</p>
        </div>
        <div className="discovery-location-stack">
          <div className={`consumer-status ${activeCenter ? "is-ready" : "is-needed"}`} title={locationLabel}>
            <Ic.MapPin size={14} /> <span>{locationLabel}</span>
          </div>
          <span className="discovery-location-source">{locationSource}</span>
          <button className="consumer-button secondary compact" onClick={openAreaPicker}>
            <Ic.MapPin size={15} /> Adjust area
          </button>
        </div>
      </header>

      <div className="consumer-toolbar discovery-toolbar" aria-label="Find a business">
        <label className="consumer-search-control discovery-search-control">
          <Ic.Search size={18} />
          <span className="sr-only">Search businesses or services</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses, outlets, or services" />
          {query ? <button type="button" className="discovery-clear-search" aria-label="Clear search" onClick={() => setQuery("")}>×</button> : null}
        </label>
        <button className={`discovery-scope-toggle ${mode === "global" ? "is-active" : ""}`} onClick={exploreEverywhere}>
          <Ic.Map size={15} /> {mode === "global" ? "Everywhere" : "Search everywhere"}
        </button>
        <div className="consumer-view-switch" role="group" aria-label="Discovery view">
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}><Ic.Grid size={16} /> List</button>
          <button className={view === "map" ? "is-active" : ""} onClick={() => setView("map")}><Ic.Map size={16} /> Map</button>
        </div>
      </div>

      <div className="consumer-filter-row discovery-filter-row" role="tablist" aria-label="Business categories">
        {categoryOptions.map((item) => (
          <button key={item} className={`consumer-filter ${category === item ? "is-active" : ""}`} role="tab" aria-selected={category === item} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>

      {!activeCenter && mode === "nearby" ? (
        <div className="discovery-location-banner" role="status">
          <span className="discovery-banner-icon"><Ic.MapPin size={17} /></span>
          <span><strong>Set your area to see places within 10 km.</strong><small>{isDenied ? "Location access is off. Choose an area on the map or enable it in your browser." : "Spotly uses your location only to sort nearby outlets."}</small></span>
          <button className="consumer-button compact" onClick={activeCenter ? useDeviceLocation : openAreaPicker}>{activeCenter ? "Use my location" : "Choose an area"}</button>
        </div>
      ) : null}
      {locationError && !isDenied ? <div className="consumer-inline-error" role="alert">{locationError}</div> : null}
      {permissionStatus === "unsupported" ? <div className="consumer-inline-error" role="alert">This browser does not provide location access. Choose an area manually.</div> : null}

      {view === "map" ? (
        <section className="discovery-workspace" aria-label="Explore outlets on a map">
          <aside className="discovery-results-pane">
            <div className="discovery-pane-heading">
              <div><div className="consumer-kicker">{mode === "viewport" ? "Map area" : mode === "global" ? "Everywhere" : "Within 10 km"}</div><h2>{loading ? "Finding places…" : `${outlets.length} ${outlets.length === 1 ? "outlet" : "outlets"}`}</h2></div>
              {mode !== "nearby" ? <button className="consumer-button quiet compact" onClick={useDeviceLocation}><Ic.MapPin size={15} /> Near me</button> : null}
            </div>
            <div className="discovery-results-scroll">
              {error ? <div className="consumer-empty-state compact-state"><h2>Could not load places.</h2><button className="consumer-button compact" onClick={() => setReloadNonce((value) => value + 1)}>Try again</button></div> : loading ? <div className="discovery-skeleton-list" aria-label="Loading places"><span /><span /><span /></div> : outlets.length === 0 ? <div className="consumer-empty-state compact-state"><span className="discovery-empty-mark"><Ic.MapPin size={19} /></span><h2>{mode === "global" && !query.trim() ? "Search a place or service" : "Nothing here yet"}</h2><p>{mode === "global" && !query.trim() ? "Turn on Search everywhere after entering a search term." : "Move the map, adjust your area, or clear a filter."}</p></div> : outlets.map((outlet) => (
                <article key={outlet.id} data-outlet-id={outlet.id} className={`consumer-place-row discovery-place-card ${selectedId === outlet.id ? "is-selected" : ""}`} onMouseEnter={() => setSelectedId(outlet.id)} onFocus={() => setSelectedId(outlet.id)}>
                  <span className="consumer-place-logo discovery-place-icon"><Ic.Store size={19} /></span>
                  <span className="consumer-place-copy"><span className="discovery-place-business">{outlet.merchant.name}</span><h3>{outlet.name}</h3><p>{outlet.merchant.category || "Everyday services"}</p><small>{outlet.address || "Address unavailable"}</small></span>
                  <span className="consumer-place-meta"><strong className={outlet.isActive === false ? "is-paused" : ""}>{outlet.isActive === false ? "Paused" : "Requests open"}</strong>{formatDistance(outlet.distanceMeters) ? <small>{formatDistance(outlet.distanceMeters)}</small> : null}<Link className="discovery-card-link" href={resultHref(outlet)} aria-label={`View details for ${outlet.name}`}>Details <Ic.Arrow size={15} /></Link></span>
                </article>
              ))}
            </div>
          </aside>
          <div className="discovery-map-pane">
            <div className="discovery-map-topline"><span>{mode === "nearby" ? "Showing a 10 km radius" : mode === "viewport" ? "Exploring this map area" : "Showing search matches"}</span><button className="consumer-button quiet compact" onClick={activeCenter ? useDeviceLocation : openAreaPicker} disabled={locationLoading}><Ic.MapPin size={15} /> {locationLoading ? "Finding you…" : activeCenter ? "Recenter" : "Set location"}</button></div>
            <MapDiscovery outlets={outlets} center={center} selectedId={selectedId} userLocation={location ? [location.latitude, location.longitude] : undefined} userAccuracy={location?.accuracy} onSelect={(outlet) => setSelectedId(outlet.id)} onBoundsChange={handleBoundsChange} />
            {selected ? <div className="consumer-map-selection discovery-selected-card"><div><div className="consumer-kicker">Selected outlet</div><h2>{selected.name}</h2><p>{selected.merchant.name} · {selected.address || "Address unavailable"}</p></div><Link className="consumer-button" href={resultHref(selected)} onClick={() => router.prefetch(resultHref(selected))}>View details <Ic.Arrow size={16} /></Link></div> : <div className="discovery-map-hint"><Ic.Map size={15} /> Pan the map to explore another area</div>}
          </div>
        </section>
      ) : (
        <section className="consumer-section discovery-list-section" aria-live="polite">
          <div className="consumer-section-heading"><div><div className="consumer-kicker">{mode === "global" ? "Search results" : "Nearby outlets"}</div><h2>{mode === "global" ? (query.trim() ? `Results for “${query.trim()}”` : "Search everywhere") : "Places worth the walk"}</h2></div><span>{loading ? "Updating…" : `${outlets.length} ${outlets.length === 1 ? "outlet" : "outlets"}`}</span></div>
          {error ? <div className="consumer-empty-state"><h2>We could not load the directory.</h2><p>Try again when the catalog is available.</p><button className="consumer-button" onClick={() => setReloadNonce((value) => value + 1)}>Try again</button></div> : loading ? <div className="discovery-skeleton-list discovery-skeleton-list-wide" aria-label="Loading places"><span /><span /><span /><span /></div> : outlets.length === 0 ? <div className="consumer-empty-state"><span className="discovery-empty-mark"><Ic.MapPin size={21} /></span><h2>{mode === "global" && !query.trim() ? "Search for a place anywhere" : mode === "nearby" ? "No nearby outlets yet" : "No outlets in this area"}</h2><p>{mode === "nearby" ? "Choose another area or search everywhere to discover more of Spotly." : "Try moving the map or choosing another area."}</p><div className="discovery-empty-actions"><button className="consumer-button" onClick={openAreaPicker}>Choose an area</button><button className="consumer-button secondary" onClick={exploreEverywhere}>Search everywhere</button></div></div> : <div className="consumer-place-list discovery-list">{outlets.map((outlet) => <article key={outlet.id} data-outlet-id={outlet.id} className="consumer-place-row discovery-place-card" onMouseEnter={() => setSelectedId(outlet.id)} onFocus={() => setSelectedId(outlet.id)}><span className="consumer-place-logo discovery-place-icon"><Ic.Store size={19} /></span><span className="consumer-place-copy"><span className="discovery-place-business">{outlet.merchant.name}</span><h3>{outlet.name}</h3><p>{outlet.merchant.category || "Everyday services"}</p><small>{outlet.address || "Address unavailable"}</small></span><span className="consumer-place-meta"><strong className={outlet.isActive === false ? "is-paused" : ""}>{outlet.isActive === false ? "Requests paused" : "Requests enabled"}</strong>{formatDistance(outlet.distanceMeters) ? <small>{formatDistance(outlet.distanceMeters)}</small> : null}<Link className="discovery-card-link" href={resultHref(outlet)} aria-label={`View details for ${outlet.name}`}>View details <Ic.Arrow size={15} /></Link></span></article>)}</div>}
        </section>
      )}

      {showLocationPicker ? <div className="consumer-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLocationPicker(false); }}><section className="consumer-location-modal" role="dialog" aria-modal="true" aria-labelledby="location-picker-title"><div className="consumer-location-modal-head"><div><div className="consumer-kicker">Discovery location</div><h2 id="location-picker-title">Where should Spotly look?</h2><p>Choose a point and we’ll show outlets within 10 km.</p></div><button className="consumer-icon-button" aria-label="Close location picker" onClick={() => setShowLocationPicker(false)}>×</button></div><form className="consumer-area-search" onSubmit={searchAreas}><label htmlFor="area-search-input">Search a city or address</label><div><Ic.Search size={16} /><input id="area-search-input" value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="Try Shimla, Koramangala, or an address" /><button className="consumer-button compact" type="submit" disabled={searchingAreas}>{searchingAreas ? "Searching…" : "Search"}</button></div>{areaSearchError ? <small role="alert">{areaSearchError}</small> : null}</form>{areaResults.length ? <div className="consumer-area-results" aria-label="Place search results">{areaResults.map((result) => <button key={`${result.latitude}-${result.longitude}-${result.label}`} type="button" onClick={() => { setAreaResults([]); chooseManualLocation(result.latitude, result.longitude, result.label); }}><Ic.MapPin size={15} /><span>{result.label}</span><Ic.Arrow size={14} /></button>)}</div> : null}<div className="consumer-location-modal-actions"><button className="consumer-button secondary" onClick={useDeviceLocation} disabled={locationLoading}><Ic.MapPin size={16} /> {locationLoading ? "Finding you…" : "Use my location"}</button><span>or drag the pin to refine it, then confirm</span></div><MapPicker lat={pickerCenter[0]} lng={pickerCenter[1]} onSelect={chooseManualLocation} zoom={activeCenter ? 13 : 5} /></section></div> : null}
    </div>
  );
}

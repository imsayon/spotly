"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Ic, useToasts } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { useLiveLocation } from "@/lib/useLiveLocation";
import api from "@/lib/api";

type Place = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  outlets?: Array<{
    id: string;
    name: string;
    address?: string | null;
    isActive?: boolean;
    lat?: number | null;
    lng?: number | null;
  }>;
};

const MapDiscovery = dynamic(() => import("@/components/MapDiscovery"), {
  ssr: false,
  loading: () => <div className="consumer-map-loading">Loading map…</div>,
});

export default function ConsumerHome() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { add } = useToasts();
  const { location, requestLocation, isDenied } = useLiveLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setCategory(params.get("category") || "All");
    setView(params.get("view") === "map" ? "map" : "list");
    setHydrated(true);
  }, []);

  const categoryOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          places
            .map((place) => place.category?.trim())
            .filter((item): item is string => !!item),
        ),
      ),
    ],
    [places],
  );

  useEffect(() => {
    if (
      hydrated &&
      places.length &&
      category !== "All" &&
      !categoryOptions.includes(category)
    )
      setCategory("All");
  }, [category, categoryOptions, hydrated, places.length]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    if (view === "map") params.set("view", "map");
    const next = params.toString() ? `/home?${params.toString()}` : "/home";
    window.history.replaceState(null, "", next);
  }, [category, hydrated, query, view]);

  useEffect(() => {
    let mounted = true;
    api
      .get("/merchant")
      .then((response) => {
        if (mounted) setPlaces(response.data.data || []);
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          add("Businesses could not be loaded", "error");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [add]);

  const visible = useMemo(
    () =>
      places.filter((place) => {
        const text =
          `${place.name} ${place.category || ""} ${place.address || ""}`.toLowerCase();
        return (
          (!query || text.includes(query.trim().toLowerCase())) &&
          (category === "All" ||
            place.category?.trim().toLowerCase() === category.toLowerCase())
        );
      }),
    [category, places, query],
  );
  const mappable = useMemo(
    () =>
      visible.filter(
        (place) =>
          (Number.isFinite(place.lat) && Number.isFinite(place.lng)) ||
          place.outlets?.some(
            (outlet) =>
              Number.isFinite(outlet.lat) && Number.isFinite(outlet.lng),
          ),
      ),
    [visible],
  );
  const center: [number, number] | undefined = location
    ? [location.latitude, location.longitude]
    : mappable[0] &&
        Number.isFinite(mappable[0].lat) &&
        Number.isFinite(mappable[0].lng)
      ? [mappable[0].lat as number, mappable[0].lng as number]
      : undefined;
  const open = (place: Place) =>
    router.push(
      `/merchant?id=${encodeURIComponent(place.id)}${place.outlets?.length === 1 ? `&outletId=${encodeURIComponent(place.outlets[0].id)}` : ""}`,
    );
  const locationLabel = profile?.location || "Location stays optional";

  return (
    <div className="consumer-page">
      <header className="consumer-page-heading">
        <div>
          <div className="consumer-kicker">Discover</div>
          <h1 className="consumer-editorial">A calmer way to walk in.</h1>
          <p>
            Find a business, understand the outlet, and request a place when you
            are ready.
          </p>
        </div>
        <div className="consumer-status">
          <Ic.MapPin size={14} /> {locationLabel}
        </div>
      </header>
      <div className="consumer-toolbar" aria-label="Find a business">
        <label className="consumer-search-control">
          <Ic.Search size={18} />
          <span className="sr-only">Search businesses or services</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses or services"
          />
        </label>
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          role="tablist"
          aria-label="Business categories"
        >
          {categoryOptions.map((item) => (
            <button
              key={item}
              className={`consumer-filter ${category === item ? "is-active" : ""}`}
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div
          className="consumer-view-switch"
          role="group"
          aria-label="Discovery view"
        >
          <button
            className={view === "list" ? "is-active" : ""}
            onClick={() => setView("list")}
          >
            <Ic.Grid size={16} /> List
          </button>
          <button
            className={view === "map" ? "is-active" : ""}
            onClick={() => setView("map")}
          >
            <Ic.Map size={16} /> Map
          </button>
        </div>
      </div>
      {view === "map" ? (
        <section className="consumer-map-section" aria-label="Business map">
          <div className="consumer-map-actions">
            <span>
              {mappable.length
                ? `${mappable.length} places on the map`
                : "Some places are available in List only."}
            </span>
            <button className="consumer-button quiet" onClick={requestLocation}>
              <Ic.MapPin size={16} /> Use my location
            </button>
          </div>
          {isDenied ? (
            <div className="consumer-inline-error" role="alert">
              Location access was denied. The directory still works without it.
            </div>
          ) : null}
          {loading ? (
            <div className="consumer-empty-state">
              <p>Loading businesses…</p>
            </div>
          ) : error ? (
            <div className="consumer-empty-state">
              <h2>We could not load the directory.</h2>
              <button
                className="consumer-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : mappable.length ? (
            <div className="consumer-map-wrap">
              <MapDiscovery
                merchants={mappable}
                center={center}
                userLocation={
                  location ? [location.latitude, location.longitude] : undefined
                }
                onSelect={setSelected}
              />
            </div>
          ) : (
            <div className="consumer-empty-state">
              <h2>Map unavailable for these results.</h2>
              <p>Switch to List to see every available place.</p>
              <button
                className="consumer-button"
                onClick={() => setView("list")}
              >
                Switch to List
              </button>
            </div>
          )}
          {selected ? (
            <div className="consumer-map-selection">
              <div>
                <div className="consumer-kicker">Selected place</div>
                <h2>{selected.name}</h2>
                <p>{selected.category || "Everyday services"}</p>
              </div>
              <button
                className="consumer-button"
                onClick={() => open(selected)}
              >
                View place <Ic.Arrow size={16} />
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="consumer-section" aria-live="polite">
          <div className="consumer-section-heading">
            <h2>
              {category === "All" ? "Businesses to choose from" : category}
            </h2>
            <span>{visible.length} places</span>
          </div>
          {loading ? (
            <div className="consumer-empty-state">
              <p>Loading businesses…</p>
            </div>
          ) : error ? (
            <div className="consumer-empty-state">
              <h2>We could not load the directory.</h2>
              <p>Try again when the catalog is available.</p>
              <button
                className="consumer-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="consumer-empty-state">
              <h2>No places match that search.</h2>
              <p>Try another category or a shorter search term.</p>
            </div>
          ) : (
            <div className="consumer-place-list">
              {visible.map((place) => {
                const singleOutlet =
                  place.outlets?.length === 1 ? place.outlets[0] : undefined;
                const openForRequests = singleOutlet?.isActive;
                return (
                  <button
                    key={place.id}
                    className="consumer-place-row"
                    onClick={() => open(place)}
                  >
                    <span className="consumer-place-logo">
                      {place.logoUrl ? (
                        <img
                          src={place.logoUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 9,
                          }}
                        />
                      ) : (
                        place.name?.[0]?.toUpperCase() || "S"
                      )}
                    </span>
                    <span className="consumer-place-copy">
                      <h2>{place.name}</h2>
                      <p>{place.category || "Everyday services"}</p>
                      <small>
                        {singleOutlet?.address ||
                          place.address ||
                          "Select an outlet to see its address"}
                      </small>
                    </span>
                    <span className="consumer-place-meta">
                      <strong>
                        {place.outlets?.length === 1
                          ? openForRequests
                            ? "Requests enabled"
                            : "Requests paused"
                          : `${place.outlets?.length || 0} outlets`}
                      </strong>
                      <Ic.Arrow size={16} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

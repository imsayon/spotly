"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ic, useToasts } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

type Favorite = {
  id: string;
  outletId: string;
  outlet: {
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
    merchantId: string;
    merchant?: { name?: string; category?: string; logoUrl?: string };
  };
};

export default function ConsumerFavorites() {
  const router = useRouter();
  const { add } = useToasts();
  const { user, loading: authLoading } = useAuthStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/favorite");
      setFavorites(response.data.data || []);
    } catch {
      setError("Saved places could not be loaded");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    void load();
  }, [user]);
  const remove = async (outletId: string) => {
    try {
      await api.delete(`/favorite/${outletId}`);
      setFavorites((current) =>
        current.filter((favorite) => favorite.outletId !== outletId),
      );
      add("Removed from saved places", "info");
    } catch {
      add("Saved place could not be removed", "error");
    }
  };
  if (authLoading)
    return (
      <div className="consumer-page">
        <div className="consumer-empty-state">
          <p>Loading account…</p>
        </div>
      </div>
    );
  if (!user)
    return (
      <div className="consumer-page">
        <header className="consumer-page-heading">
          <div>
            <div className="consumer-kicker">Saved</div>
            <h1 className="consumer-editorial">Places worth keeping.</h1>
            <p>
              Save an outlet to return to its real services, reviews and queue
              status.
            </p>
          </div>
        </header>
        <div className="consumer-empty-state">
          <Ic.Heart size={24} />
          <h2>Sign in to see saved places.</h2>
          <p>
            Your saved outlets are tied to your account and stay available
            across devices.
          </p>
          <Link
            className="consumer-button"
            href="/auth/sign-in?returnTo=%2Fhome%2Ffavorites"
          >
            Sign in
          </Link>
          <button
            className="consumer-button quiet"
            onClick={() => router.push("/home")}
          >
            Discover places
          </button>
        </div>
      </div>
    );
  return (
    <div className="consumer-page">
      <header className="consumer-page-heading">
        <div>
          <div className="consumer-kicker">Saved</div>
          <h1 className="consumer-editorial">Places worth keeping.</h1>
          <p>
            Save an outlet to return to its real services, reviews and queue
            status.
          </p>
        </div>
        <span className="consumer-status">{favorites.length} saved</span>
      </header>
      {loading ? (
        <div className="consumer-empty-state">
          <p>Loading saved places…</p>
        </div>
      ) : error ? (
        <div className="consumer-empty-state">
          <h2>{error}</h2>
          <button className="consumer-button" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="consumer-empty-state">
          <Ic.Heart size={24} />
          <h2>No saved places yet.</h2>
          <p>Save an outlet from its detail page and it will appear here.</p>
          <button
            className="consumer-button"
            onClick={() => router.push("/home")}
          >
            Discover places
          </button>
        </div>
      ) : (
        <div className="consumer-place-list">
          {favorites.map((favorite) => (
            <div className="consumer-place-row" key={favorite.id}>
              <span className="consumer-place-logo">
                {favorite.outlet.merchant?.logoUrl ? (
                  <img
                    src={favorite.outlet.merchant.logoUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 9,
                    }}
                  />
                ) : (
                  favorite.outlet.merchant?.name?.[0]?.toUpperCase() || "S"
                )}
              </span>
              <span className="consumer-place-copy">
                <h2>
                  {favorite.outlet.merchant?.name || favorite.outlet.name}
                </h2>
                <p>
                  {favorite.outlet.merchant?.category || "Services"} ·{" "}
                  {favorite.outlet.name}
                </p>
                <small>
                  {favorite.outlet.address || "Address unavailable"}
                </small>
              </span>
              <span className="consumer-place-meta">
                <span
                  className={`consumer-status ${favorite.outlet.isActive ? "called" : "terminal"}`}
                >
                  {favorite.outlet.isActive ? "Requests enabled" : "Paused"}
                </span>
                <button
                  className="consumer-button secondary"
                  onClick={() =>
                    router.push(
                      `/merchant?id=${encodeURIComponent(favorite.outlet.merchantId)}&outletId=${encodeURIComponent(favorite.outletId)}`,
                    )
                  }
                >
                  Open
                </button>
                <button
                  className="consumer-button quiet"
                  onClick={() => remove(favorite.outletId)}
                  aria-label={`Remove ${favorite.outlet.name} from saved places`}
                >
                  <Ic.Heart fill="currentColor" size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

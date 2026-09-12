"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review } from "@spotly/types";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";

type Stats = { avgRating: number; count: number };

export default function ReviewsPage() {
  const { merchantProfile } = useAuthStore();
  const store = useQueueStore();
  const [outletId, setOutletId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ avgRating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const query =
      new URLSearchParams(window.location.search).get("outletId") || "";
    setOutletId(query || store.selectedOutletId || store.outlets[0]?.id || "");
  }, [store.outlets, store.selectedOutletId]);
  useEffect(() => {
    if (!outletId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError("");
    setReviews([]);
    setStats({ avgRating: 0, count: 0 });
    Promise.allSettled([
      api.get(`/review/outlet/${outletId}/stats`),
      api.get(`/review/outlet/${outletId}`),
    ])
      .then(([statsResult, reviewsResult]) => {
        if (!mounted) return;
        if (statsResult.status === "fulfilled")
          setStats(statsResult.value.data.data || { avgRating: 0, count: 0 });
        else setError("Review summary could not be loaded");
        if (reviewsResult.status === "fulfilled")
          setReviews(reviewsResult.value.data.data || []);
        else setError("Reviews could not be loaded");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [outletId, revision]);
  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((review) => review.rating === star).length,
      })),
    [reviews],
  );
  const outlet = store.outlets.find((item) => item.id === outletId);
  if (!merchantProfile) return null;
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 960, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Reviews</div>
          <h1>Listen to the people you served.</h1>
          <p>
            {outlet?.name || "Selected outlet"} · Real customer feedback, scoped
            to this location.
          </p>
        </div>
        <div className="merchant-scope">
          <label htmlFor="review-outlet">Outlet</label>
          <select
            id="review-outlet"
            value={outletId}
            onChange={(event) => setOutletId(event.target.value)}
          >
            {store.outlets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </header>
      {error ? (
        <div
          role="alert"
          className="merchant-card"
          style={{ padding: 14, marginBottom: 16, color: "var(--danger)" }}
        >
          {error}{" "}
          <button
            className="merchant-button quiet"
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="merchant-card merchant-empty">Loading reviews…</div>
      ) : (
        <>
          <div className="merchant-queue-grid">
            <section className="merchant-card merchant-queue-panel">
              <div className="merchant-kicker">Average rating</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 48,
                  lineHeight: 1,
                  fontWeight: 600,
                }}
              >
                {stats.count ? stats.avgRating.toFixed(1) : "—"}
              </div>
              <p style={{ color: "var(--text-secondary)" }}>
                {stats.count
                  ? `Based on ${stats.count} reviews`
                  : "No reviews yet"}
              </p>
            </section>
            <section className="merchant-card merchant-queue-panel">
              <div className="merchant-panel-heading">
                <div>
                  <h2>Rating distribution</h2>
                  <p>Counts from the selected outlet.</p>
                </div>
              </div>
              {distribution.map((item) => (
                <div
                  key={item.star}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 30px",
                    gap: 10,
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <span>{item.star}</span>
                  <div
                    style={{
                      height: 8,
                      background: "var(--surface-raised)",
                      borderRadius: 99,
                    }}
                  >
                    <div
                      style={{
                        width: `${stats.count ? Math.round((item.count / stats.count) * 100) : 0}%`,
                        height: "100%",
                        background: "var(--brand)",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 12,
                      textAlign: "right",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </section>
          </div>
          <section
            className="merchant-card merchant-queue-panel"
            style={{ marginTop: 18 }}
          >
            <div className="merchant-panel-heading">
              <div>
                <h2>Latest reviews</h2>
                <p>Newest first.</p>
              </div>
            </div>
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id} className="merchant-queue-row">
                  <span className="merchant-token">{review.rating}★</span>
                  <span className="merchant-row-copy">
                    <strong>Customer feedback</strong>
                    <small>
                      <time dateTime={new Date(review.createdAt).toISOString()}>
                        {new Intl.DateTimeFormat(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(review.createdAt))}
                      </time>
                    </small>
                    <span
                      style={{
                        display: "block",
                        marginTop: 6,
                        color: "var(--text-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {review.comment || "No written comment."}
                    </span>
                  </span>
                </article>
              ))
            ) : (
              <div className="merchant-empty">No reviews yet.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

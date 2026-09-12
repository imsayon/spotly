"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ic, useToasts } from "@spotly/ui";
import type {
  Merchant,
  Outlet,
  MenuCategory,
  Review,
  QueueEntry,
} from "@spotly/types";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";
import ConsumerLayout from "../home/layout";
import api from "@/lib/api";

type ReviewWithAuthor = Review & { user?: { name?: string | null } };
type ReviewStats = { avgRating: number; count: number };
type SectionErrors = {
  details?: boolean;
  menu?: boolean;
  reviews?: boolean;
  reviewStats?: boolean;
  queue?: boolean;
};

export default function ConsumerMerchantPage() {
  return (
    <ConsumerLayout>
      <MerchantDetail />
    </ConsumerLayout>
  );
}

function MerchantDetail() {
  const router = useRouter();
  const { user, loading: authLoading, identityError } = useAuthStore();
  const { myEntry, joinQueue } = useQueueStore();
  const { add } = useToasts();
  const [revision, setRevision] = useState(0);
  const [merchantId, setMerchantId] = useState("");
  const [requestedOutletId, setRequestedOutletId] = useState("");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [invalidOutlet, setInvalidOutlet] = useState(false);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    avgRating: 0,
    count: 0,
  });
  const [queueWaiting, setQueueWaiting] = useState<number | null>(null);
  const [queueCalled, setQueueCalled] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sectionError, setSectionError] = useState<SectionErrors>({});
  const [joining, setJoining] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewNotice, setReviewNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMerchantId(params.get("id") || "");
    if (!params.get("id")) setLoading(false);
    setRequestedOutletId(params.get("outletId") || "");
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    let mounted = true;
    setLoading(true);
    setSectionError({});
    Promise.all([
      api.get(`/merchant/${encodeURIComponent(merchantId)}`),
      api.get(`/outlet/merchant/${encodeURIComponent(merchantId)}`),
    ])
      .then(([merchantResponse, outletsResponse]) => {
        if (!mounted) return;
        const nextOutlets: Outlet[] = outletsResponse.data.data || [];
        const requested = nextOutlets.find(
          (outlet) => outlet.id === requestedOutletId,
        );
        setMerchant(merchantResponse.data.data);
        setOutlets(nextOutlets);
        setInvalidOutlet(!!requestedOutletId && !requested);
        setSelectedOutletId(
          requested?.id || (requestedOutletId ? "" : nextOutlets[0]?.id || ""),
        );
      })
      .catch(() => {
        if (mounted) {
          setSectionError({ details: true });
          add("Business details could not be loaded", "error");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [add, merchantId, requestedOutletId, revision]);

  useEffect(() => {
    if (!selectedOutletId) return;
    let mounted = true;
    setMenu([]);
    setReviews([]);
    setReviewStats({ avgRating: 0, count: 0 });
    setQueueWaiting(null);
    setQueueCalled(null);
    setReviewComment("");
    setReviewRating(5);
    setSectionError((value) => ({
      ...value,
      menu: false,
      reviews: false,
      reviewStats: false,
      queue: false,
    }));
    Promise.allSettled([
      api.get(`/menu/outlet/${selectedOutletId}`),
      api.get(`/review/outlet/${selectedOutletId}`),
      api.get(`/review/outlet/${selectedOutletId}/stats`),
      api.get(`/queue/outlet/${selectedOutletId}`),
    ]).then(([menuResult, reviewsResult, statsResult, queueResult]) => {
      if (!mounted) return;
      if (menuResult.status === "fulfilled")
        setMenu(menuResult.value.data.data || []);
      else setSectionError((value) => ({ ...value, menu: true }));
      if (reviewsResult.status === "fulfilled")
        setReviews(reviewsResult.value.data.data || []);
      else setSectionError((value) => ({ ...value, reviews: true }));
      if (statsResult.status === "fulfilled")
        setReviewStats(
          statsResult.value.data.data || { avgRating: 0, count: 0 },
        );
      else setSectionError((value) => ({ ...value, reviewStats: true }));
      if (queueResult.status === "fulfilled") {
        const entries: QueueEntry[] = queueResult.value.data.data || [];
        setQueueWaiting(
          entries.filter((entry) => entry.status === "WAITING").length,
        );
        setQueueCalled(
          entries.filter((entry) => entry.status === "CALLED").length,
        );
      } else setSectionError((value) => ({ ...value, queue: true }));
    });
    return () => {
      mounted = false;
    };
  }, [selectedOutletId, revision]);

  useEffect(() => {
    if (!selectedOutletId || !user) {
      setSaved(false);
      return;
    }
    api
      .get("/favorite")
      .then(({ data }) =>
        setSaved(
          (data.data || []).some(
            (favorite: { outletId: string }) =>
              favorite.outletId === selectedOutletId,
          ),
        ),
      )
      .catch(() => {});
  }, [selectedOutletId, user]);

  const outlet = outlets.find((item) => item.id === selectedOutletId);
  const services = useMemo(
    () =>
      menu.flatMap((category) =>
        (category.items || []).map((item) => ({
          ...item,
          category: category.name,
        })),
      ),
    [menu],
  );
  const directions =
    outlet?.lat != null && outlet.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${outlet.lat},${outlet.lng}`
      : outlet?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.address)}`
        : "";
  const website =
    merchant?.website && /^https?:\/\//i.test(merchant.website)
      ? merchant.website
      : "";
  const currentReview = reviews.find((review) => review.userId === user?.id);

  useEffect(() => {
    if (currentReview) {
      setReviewRating(currentReview.rating);
      setReviewComment(currentReview.comment || "");
    }
  }, [currentReview?.id, currentReview?.rating, currentReview?.comment]);

  const selectOutlet = (id: string) => {
    setInvalidOutlet(false);
    setSelectedOutletId(id);
    router.replace(
      `/merchant?id=${encodeURIComponent(merchantId)}&outletId=${encodeURIComponent(id)}`,
    );
  };
  const requestSpot = async () => {
    if (!outlet || invalidOutlet || authLoading || identityError || joining)
      return;
    if (myEntry) {
      router.push(`/home/queue?entryId=${encodeURIComponent(myEntry.id)}`);
      return;
    }
    if (!outlet.isActive) return;
    if (!user) {
      router.push(
        `/auth/sign-in?returnTo=${encodeURIComponent(`/merchant?id=${merchantId}&outletId=${outlet.id}`)}`,
      );
      return;
    }
    setJoining(true);
    try {
      const entry = await joinQueue(outlet.id);
      add(
        "Request sent. The business will accept it before you enter the queue.",
        "success",
      );
      router.push(`/home/queue?entryId=${encodeURIComponent(entry.id)}`);
    } catch (error: any) {
      add(error?.message || "This request could not be sent.", "error");
    } finally {
      setJoining(false);
    }
  };
  const toggleSaved = async () => {
    if (!outlet) return;
    if (!user) {
      router.push(
        `/auth/sign-in?returnTo=${encodeURIComponent(`/merchant?id=${merchantId}&outletId=${outlet.id}`)}`,
      );
      return;
    }
    setSavingFavorite(true);
    try {
      if (saved) await api.delete(`/favorite/${outlet.id}`);
      else await api.post("/favorite", { outletId: outlet.id });
      setSaved(!saved);
      add(saved ? "Removed from saved places" : "Saved this outlet", "success");
    } catch {
      add("Saved place could not be updated", "error");
    } finally {
      setSavingFavorite(false);
    }
  };
  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !outlet) return;
    setReviewSaving(true);
    setReviewNotice("");
    try {
      await api.post("/review", {
        outletId: outlet.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const [reviewsResponse, statsResponse] = await Promise.all([
        api.get(`/review/outlet/${outlet.id}`),
        api.get(`/review/outlet/${outlet.id}/stats`),
      ]);
      setReviews(reviewsResponse.data.data || []);
      setReviewStats(statsResponse.data.data || { avgRating: 0, count: 0 });
      setReviewNotice("Your review is saved.");
    } catch {
      setReviewNotice("Your review could not be saved. Try again.");
    } finally {
      setReviewSaving(false);
    }
  };

  if (loading)
    return (
      <div className="consumer-empty-state">
        <p>Loading business details…</p>
      </div>
    );
  if (!merchant)
    return (
      <div className="consumer-empty-state">
        <h2>{sectionError.details ? "Business details unavailable" : "Business not found"}</h2>
        <p>Check the link and try again.</p><button className="consumer-button" onClick={() => setRevision((value) => value + 1)}>Retry</button>
        <button
          className="consumer-button"
          onClick={() => router.push("/home")}
        >
          Back to discover
        </button>
      </div>
    );

  return (
    <div className="consumer-page">
      <button
        className="consumer-button quiet"
        onClick={() => router.push("/home")}
      >
        <Ic.ChevL size={15} /> Back to discover
      </button>
      {Object.values(sectionError).some(Boolean) ? <div role="alert" className="consumer-inline-error">Some outlet information could not be loaded. <button className="consumer-button quiet" onClick={() => setRevision((value) => value + 1)}>Retry</button></div> : null}<div className="consumer-detail-grid" style={{ marginTop: 16 }}>
        <section className="consumer-card consumer-detail-main">
          <div className="consumer-kicker">
            {merchant.category || "Business"}
          </div>
          <h1 className="consumer-editorial">{merchant.name}</h1>
          <p>
            {merchant.description ||
              "Choose an outlet to see its queue, services and customer feedback."}
          </p>
          <div className="consumer-section">
            <div className="consumer-section-heading">
              <h2>Choose an outlet</h2>
              <span>{outlets.length} locations</span>
            </div>
            {invalidOutlet ? (
              <div className="consumer-inline-error" role="alert">
                That outlet is no longer part of this business. Choose a current
                outlet below.
              </div>
            ) : null}
            {outlets.length === 0 ? (
              <div className="consumer-empty-state">
                <h2>No outlets are published yet.</h2>
                <p>Try again later or return to discover.</p>
              </div>
            ) : (
              <div className="consumer-outlet-list">
                {outlets.map((item) => (
                  <div
                    className="consumer-outlet"
                    key={item.id}
                    style={
                      item.id === selectedOutletId
                        ? {
                            borderColor: "var(--brand)",
                            background: "var(--brand-soft)",
                          }
                        : undefined
                    }
                  >
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.address || "Address unavailable"}</p>
                      <span
                        className={`consumer-status ${item.isActive ? "called" : "terminal"}`}
                        style={{ marginTop: 9 }}
                      >
                        {item.isActive ? "Requests enabled" : "Requests paused"}
                      </span>
                    </div>
                    <div className="consumer-outlet-actions">
                      <button
                        className="consumer-button secondary"
                        onClick={() => selectOutlet(item.id)}
                      >
                        {item.id === selectedOutletId
                          ? "Selected"
                          : "View outlet"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {outlet ? (
            <>
              <div className="consumer-section">
                <div className="consumer-section-heading">
                  <h2>{outlet.name}</h2>
                  <span>
                    {sectionError.queue
                      ? "Queue unavailable"
                      : queueWaiting === null
                        ? "Checking queue"
                        : `${queueWaiting} waiting · ${queueCalled ?? 0} called`}
                  </span>
                </div>
                <div
                  className="consumer-card"
                  style={{ padding: 18, background: "var(--surface-raised)" }}
                >
                  <p style={{ margin: 0 }}>
                    {outlet.isActive
                      ? "Request a spot when you are ready. The business accepts requests before the waiting line is confirmed."
                      : "Requests are paused at this outlet. Existing customers can still be served."}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 16,
                    }}
                  >
                    <button
                      className="consumer-button"
                      disabled={
                        (!outlet.isActive && !myEntry) ||
                        joining ||
                        invalidOutlet ||
                        authLoading ||
                        !!identityError
                      }
                      onClick={requestSpot}
                    >
                      {joining
                        ? "Sending request…"
                        : myEntry
                          ? "View your turn"
                          : "Request a spot"}
                      <Ic.Arrow size={16} />
                    </button>
                    <button
                      className="consumer-button secondary"
                      disabled={savingFavorite}
                      onClick={toggleSaved}
                    >
                      <Ic.Heart
                        size={15}
                        fill={saved ? "currentColor" : "none"}
                      />{" "}
                      {saved ? "Saved" : "Save outlet"}
                    </button>
                    {directions ? (
                      <a
                        className="consumer-button secondary"
                        href={directions}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Directions <Ic.MapPin size={15} />
                      </a>
                    ) : null}
                    {merchant.phone ? (
                      <a
                        className="consumer-button quiet"
                        href={`tel:${merchant.phone}`}
                      >
                        Call business
                      </a>
                    ) : null}
                    {website ? (
                      <a
                        className="consumer-button quiet"
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="consumer-section">
                <div className="consumer-section-heading">
                  <h2>Services</h2>
                  <span>
                    {sectionError.menu
                      ? "Unavailable"
                      : `${services.length} listed`}
                  </span>
                </div>
                {sectionError.menu ? (
                  <p role="alert">Services could not be loaded.</p>
                ) : services.length === 0 ? (
                  <div className="consumer-empty-state">
                    <p>No services have been added for this outlet.</p>
                  </div>
                ) : (
                  <div className="consumer-place-list">
                    {services.map((service) => (
                      <div
                        className="consumer-place-row"
                        key={service.id}
                        style={{ cursor: "default" }}
                      >
                        <span
                          className="consumer-place-logo"
                          style={{ width: 42, height: 42, fontSize: 16 }}
                        >
                          ₹
                        </span>
                        <span className="consumer-place-copy">
                          <h2>{service.name}</h2>
                          <p>{service.category}</p>
                          {service.description ? (
                            <small>{service.description}</small>
                          ) : null}
                        </span>
                        <span className="consumer-place-meta">
                          <strong>
                            ₹
                            {Number(service.price).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
        <aside id="reviews" className="consumer-card consumer-detail-side">
          <div className="consumer-kicker">Customer feedback</div>
          <h2>
            {sectionError.reviewStats
              ? "Review summary unavailable"
              : reviewStats.count
                ? `${reviewStats.avgRating.toFixed(1)} / 5`
                : "No reviews yet"}
          </h2>
          <p>
            {reviewStats.count
              ? `Based on ${reviewStats.count} reviews for this outlet.`
              : "Be the first to share your experience after a visit."}
          </p>
          {sectionError.reviews ? (
            <p role="alert">Reviews could not be loaded.</p>
          ) : reviews.length ? (
            reviews.slice(0, 4).map((review) => (
              <article className="consumer-review" key={review.id}>
                <header>
                  <span aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}
                  </span>
                  <time dateTime={new Date(review.createdAt).toISOString()}>
                    {new Intl.DateTimeFormat(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(review.createdAt))}
                  </time>
                </header>
                <strong>{review.user?.name || "Customer"}</strong>
                <p>{review.comment || "No written comment."}</p>
              </article>
            ))
          ) : (
            <div className="consumer-empty-state" style={{ minHeight: 120 }}>
              No reviews yet.
            </div>
          )}
          {user && outlet ? (
            <form className="consumer-review-form" onSubmit={submitReview}>
              <div className="consumer-kicker">
                {currentReview ? "Update your review" : "Share your experience"}
              </div>
              <fieldset>
                <legend>Rating</legend>
                <div className="consumer-rating-options">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating}>
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={reviewRating === rating}
                        onChange={() => setReviewRating(rating)}
                      />
                      {rating}★
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="consumer-field">
                <span>Comment (optional)</span>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                />
              </label>
              {reviewNotice ? (
                <div
                  className="consumer-inline-error"
                  role={
                    reviewNotice.startsWith("Your review is")
                      ? "status"
                      : "alert"
                  }
                >
                  {reviewNotice}
                </div>
              ) : null}
              <button className="consumer-button" disabled={reviewSaving}>
                {reviewSaving
                  ? "Saving…"
                  : currentReview
                    ? "Update review"
                    : "Submit review"}
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

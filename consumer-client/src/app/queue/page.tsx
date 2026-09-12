"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ConsumerLayout from "../home/layout";
import { Ic, useToasts } from "@spotly/ui";
import type { QueueEntry, QueueUpdatePayload } from "@spotly/types";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore, waitingAhead } from "@/store/queue.store";
import api from "@/lib/api";
import { subscribeToOutlet } from "@/lib/socket";

const activeStatuses = new Set(["PENDING_ACCEPTANCE", "WAITING", "CALLED"]);

function statusCopy(status: QueueEntry["status"], ahead: number | null) {
  if (status === "PENDING_ACCEPTANCE")
    return [
      "Request sent",
      "The business will accept your request before you enter the waiting line.",
    ];
  if (status === "WAITING")
    return [
      ahead === null
        ? "Your place is confirmed"
        : ahead
          ? `${ahead} ${ahead === 1 ? "person" : "people"} ahead`
          : "You are next",
      "Keep this ticket handy. This page will show the next confirmed state.",
    ];
  if (status === "CALLED")
    return ["Your turn", "Please go to the counter now."];
  if (status === "SERVED")
    return ["Visit complete", "Thanks for using Spotly."];
  if (status === "MISSED")
    return [
      "Request ended",
      "This request is no longer active. It may have expired or been ended by the business.",
    ];
  if (status === "CANCELLED")
    return ["You left the queue", "This request cannot be restored."];
  return ["Request ended", "This request is no longer active."];
}

export default function ConsumerQueuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthStore();
  const { add } = useToasts();
  const leaveQueue = useQueueStore((state) => state.leaveQueue);
  const handleQueueUpdate = useQueueStore((state) => state.handleQueueUpdate);
  const [entryId, setEntryId] = useState("");
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [queue, setQueue] = useState<QueueUpdatePayload["entries"]>([]);
  const [ahead, setAhead] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pathname === "/queue")
      router.replace(`/home/queue${window.location.search}`);
  }, [pathname, router]);

  useEffect(() => {
    setEntryId(
      new URLSearchParams(window.location.search).get("entryId") || "",
    );
  }, []);

  const applyQueue = useCallback(
    (entries: QueueUpdatePayload["entries"], current: QueueEntry) => {
      setQueue(entries);
      setAhead(waitingAhead(entries, current));
      setStale(false);
      setLastUpdated(Date.now());
    },
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    setLoading(true);
    setError(false);
    if (!user) {
      setEntry(null);
      setQueue([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    const request = entryId
      ? api.get(`/queue/entry/${encodeURIComponent(entryId)}`)
      : api.get("/queue/active");
    request
      .then(async (response) => {
        if (!mounted) return;
        const current: QueueEntry | null = response.data.data;
        if (!current) {
          setEntry(null);
          setQueue([]);
          return;
        }
        setEntry(current);
        if (!activeStatuses.has(current.status)) return;
        try {
          const queueResponse = await api.get(
            `/queue/outlet/${current.outletId}`,
          );
          if (mounted) applyQueue(queueResponse.data.data || [], current);
        } catch {
          if (mounted) {
            setStale(true);
            setAhead(null);
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          add("This queue ticket could not be loaded", "error");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [add, applyQueue, authLoading, entryId, user, revision]);

  const trackedOutletId = entry?.outletId;
  const trackedEntryId = entry?.id;
  const trackedStatus = entry?.status;
  useEffect(() => {
    if (
      !trackedOutletId ||
      !trackedEntryId ||
      !user ||
      !trackedStatus ||
      !activeStatuses.has(trackedStatus)
    )
      return;
    let mounted = true;
    const refreshTicket = async (entries?: QueueUpdatePayload["entries"]) => {
      try {
        const response = await api.get(
          `/queue/entry/${encodeURIComponent(trackedEntryId)}`,
        );
        if (!mounted) return;
        const next: QueueEntry = response.data.data;
        setEntry(next);
        if (next && entries) applyQueue(entries, next);
        setLastUpdated(Date.now());
      } catch {
        if (mounted) setStale(true);
      }
    };
    const cleanup = subscribeToOutlet(
      trackedOutletId,
      {
        onQueueUpdate: (payload) => {
          if (!mounted || payload.outletId !== trackedOutletId) return;
          handleQueueUpdate(payload);
          void refreshTicket(payload.entries);
        },
        onTokenCalled: (payload) => {
          if (payload.outletId === trackedOutletId) void refreshTicket();
        },
      },
      () => {
        if (mounted) setRevision((value) => value + 1);
      },
      () => {
        if (mounted) setStale(true);
      },
    );
    return () => {
      mounted = false;
      cleanup();
    };
  }, [
    applyQueue,
    handleQueueUpdate,
    trackedEntryId,
    trackedOutletId,
    trackedStatus,
    user,
  ]);

  useEffect(() => {
    const store = useQueueStore.getState();
    if (entry && !activeStatuses.has(entry.status) && store.myEntry?.id === entry.id) store.clearActive();
  }, [entry]);

  const isActive = !!entry && activeStatuses.has(entry.status);
  const [headline, instruction] = useMemo(
    () => (entry ? statusCopy(entry.status, ahead) : ["", ""]),
    [ahead, entry],
  );
  const outlet = (
    entry as QueueEntry & {
      outlet?: {
        name?: string;
        address?: string;
        lat?: number;
        lng?: number;
        merchantId?: string;
      };
    }
  )?.outlet;
  const outletName = outlet?.name || "Selected outlet";
  const directions =
    outlet?.lat != null && outlet?.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${outlet.lat},${outlet.lng}`
      : outlet?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.address)}`
        : "";

  const handleLeave = async () => {
    if (
      !entry ||
      !isActive ||
      leaving ||
      !window.confirm("Leave this request? It cannot be restored.")
    )
      return;
    setLeaving(true);
    try {
      await leaveQueue(entry.id);
      add("Request cancelled", "info");
      setEntry((value) => (value ? { ...value, status: "CANCELLED" } : value));
    } catch {
      add("We could not cancel this request. Try again.", "error");
      setRevision((value) => value + 1);
    } finally {
      setLeaving(false);
    }
  };

  if (loading || authLoading)
    return (
      <div className="consumer-empty-state">
        <p>Loading your ticket…</p>
      </div>
    );
  if (!user) {
    const returnTo = `/home/queue${entryId ? `?entryId=${encodeURIComponent(entryId)}` : ""}`;
    return (
      <div className="consumer-empty-state">
        <Ic.User size={24} />
        <h2>Sign in to see your turn.</h2>
        <p>
          Your queue ticket is private to your account. Sign in and we will
          return you to this screen.
        </p>
        <Link
          className="consumer-button"
          href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
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
    );
  }
  if (error)
    return (
      <div className="consumer-empty-state">
        <h2>Ticket unavailable</h2>
        <p>Check your connection and try again.</p>
        <button
          className="consumer-button"
          onClick={() => setRevision((value) => value + 1)}
        >
          Retry
        </button>
      </div>
    );
  if (!entry)
    return (
      <div className="consumer-empty-state">
        <Ic.Clock size={24} />
        <h2>No active request.</h2>
        <p>
          Request a spot from a business and your confirmed ticket will appear
          here.
        </p>
        <button
          className="consumer-button"
          onClick={() => router.push("/home")}
        >
          Discover places
        </button>
      </div>
    );

  const content = (
    <div className="consumer-page">
      <button
        className="consumer-button quiet"
        onClick={() => router.push("/home")}
      >
        <Ic.ChevL size={15} /> Back to discover
      </button>
      <section
        className="consumer-card consumer-ticket"
        style={{ marginTop: 16 }}
      >
        <div className="consumer-ticket-accent" />
        <div className="consumer-ticket-head">
          <div>
            <div className="consumer-kicker">{outletName}</div>
            <h1>Your queue ticket</h1>
            <p className="consumer-ticket-meta">
              {outlet?.address || "Address unavailable"} · Requested{" "}
              <time dateTime={new Date(entry.createdAt).toISOString()}>
                {new Date(entry.createdAt).toLocaleString()}
              </time>
            </p>
          </div>
          <span
            className={`consumer-status ${entry.status === "CALLED" ? "called" : isActive ? "waiting" : "terminal"}`}
          >
            {entry.status === "PENDING_ACCEPTANCE"
              ? "Awaiting acceptance"
              : entry.status.replace("_", " ")}
          </span>
        </div>
        <div className="consumer-token">
          <span>Your token</span>
          <strong>{String(entry.tokenNumber).padStart(3, "0")}</strong>
        </div>
        <div className="consumer-ticket-message">
          <strong>{headline}</strong>
          <span>{instruction}</span>
          {entry.status === "PENDING_ACCEPTANCE" ? (
            <small>
              Unaccepted requests expire after ten minutes. The business
              controls acceptance.
            </small>
          ) : null}
        </div>
        {entry.status === "WAITING" && queue.length ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Queue position is based on the business's confirmed order.
          </p>
        ) : null}
        {directions ? (
          <a
            className="consumer-button secondary"
            href={directions}
            target="_blank"
            rel="noreferrer"
          >
            <Ic.MapPin size={15} /> Directions
          </a>
        ) : null}
        <div role="status" style={{ margin: "16px 0", fontSize: 14 }}>
          {stale
            ? "Live updates unavailable. Showing your last confirmed ticket."
            : lastUpdated
              ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
              : ""}{" "}
          <button
            className="consumer-button quiet"
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh
          </button>
        </div>
        <div className="consumer-ticket-actions">
          {isActive ? (
            <button
              className="consumer-button quiet"
              disabled={leaving}
              onClick={handleLeave}
            >
              {leaving ? "Leaving…" : "Leave request"}
            </button>
          ) : (
            <>
              <button
                className="consumer-button"
                onClick={() => router.push("/home")}
              >
                Find another business
              </button>
              {entry.status === "SERVED" && outlet?.merchantId ? (
                <button
                  className="consumer-button secondary"
                  onClick={() =>
                    router.push(
                      `/merchant?id=${encodeURIComponent(outlet.merchantId as string)}&outletId=${encodeURIComponent(entry.outletId)}`,
                    )
                  }
                >
                  Review this outlet
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
  return pathname === "/queue" ? (
    <ConsumerLayout>{content}</ConsumerLayout>
  ) : (
    content
  );
}

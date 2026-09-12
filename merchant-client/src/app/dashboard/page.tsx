"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ic } from "@spotly/ui";
import { useQueueStore, type ExtendedQueueEntry } from "@/store/queue.store";

const relativeTime = (value: string | Date) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return minutes ? `${minutes} min ago` : "Just now";
};

function EntryRow({
  entry,
  kind,
  onAccept,
  onReject,
  onRemove,
  disabled,
}: {
  entry: ExtendedQueueEntry;
  kind: "request" | "waiting";
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="merchant-queue-row">
      <span className="merchant-token">
        {String(entry.tokenNumber).padStart(3, "0")}
      </span>
      <span className="merchant-row-copy">
        <strong>
          {kind === "request" ? "New request" : "Waiting customer"}
        </strong>
        <small>
          <time
            dateTime={new Date(entry.createdAt).toISOString()}
            title={new Date(entry.createdAt).toLocaleString()}
          >
            {relativeTime(entry.createdAt)}
          </time>
        </small>
      </span>
      <span className="merchant-row-actions">
        {kind === "request" ? (
          <>
            <button
              className="merchant-button danger"
              disabled={disabled}
              onClick={onReject}
            >
              Decline
            </button>
            <button
              className="merchant-button"
              disabled={disabled}
              onClick={onAccept}
            >
              Accept
            </button>
          </>
        ) : (
          <>
            <span className="merchant-status">
              {entry.status === "WAITING" ? "Confirmed" : entry.status}
            </span>
            {onRemove ? (
              <button
                className="merchant-button quiet"
                disabled={disabled}
                onClick={onRemove}
                aria-label={`Remove token ${entry.tokenNumber} from queue`}
              >
                Remove
              </button>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}

export default function MerchantQueueWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const store = useQueueStore();
  const [tab, setTab] = useState<"requests" | "waiting">("requests");
  const [urlOutletId, setUrlOutletId] = useState("");

  useEffect(() => {
    if (pathname === "/dashboard/queue")
      router.replace(`/dashboard${window.location.search}`);
  }, [pathname, router]);

  useEffect(() => {
    setUrlOutletId(
      new URLSearchParams(window.location.search).get("outletId") || "",
    );
  }, []);
  useEffect(() => {
    if (!store.outlets.length) return;
    const target =
      store.outlets.find((outlet) => outlet.id === urlOutletId)?.id ||
      store.selectedOutletId ||
      store.outlets[0].id;
    if (target !== store.selectedOutletId) store.setSelectedOutletId(target);
    else {
      void store.fetchQueue();
      store.connectRealtime();
    }
    return () => store.disconnectRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.outlets.length, urlOutletId]);

  const pending = useMemo(
    () =>
      store.entries.filter((entry) => entry.status === "PENDING_ACCEPTANCE"),
    [store.entries],
  );
  const waiting = useMemo(
    () => store.entries.filter((entry) => entry.status === "WAITING"),
    [store.entries],
  );
  const called = useMemo(
    () => store.entries.find((entry) => entry.status === "CALLED"),
    [store.entries],
  );
  const outlet = store.outlets.find(
    (item) => item.id === store.selectedOutletId,
  );
  const askToggle = async () => {
    if (
      !store.isOpen ||
      window.confirm(
        "Pause new requests? Existing customers will remain in the queue.",
      )
    )
      try {
        await store.toggleOpen();
      } catch {
        /* The store reports the error. */
      }
  };

  const callNext = async () => {
    try {
      await store.callNext();
    } catch {
      /* store reports the server error */
    }
  };
  const markServed = async () => {
    if (called)
      try {
        await store.markServed(called.id);
      } catch {}
  };
  const markMissed = async () => {
    if (called && window.confirm(`Mark token ${called.tokenNumber} missed?`))
      try {
        await store.markMissed(called.id);
      } catch {}
  };

  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 1180, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Queue workspace</div>
          <h1>Keep the line moving.</h1>
          <p>
            {store.wsConnected
              ? "Live updates connected"
              : store.stale
                ? "Showing the last successful snapshot"
                : "Checking for queue updates"}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div className="merchant-scope">
            <label htmlFor="outlet-scope">Outlet</label>
            <select
              id="outlet-scope"
              value={store.selectedOutletId}
              onChange={(event) => {
                store.setSelectedOutletId(event.target.value);
                router.replace(
                  `/dashboard?outletId=${encodeURIComponent(event.target.value)}`,
                );
              }}
            >
              {store.outlets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`merchant-status ${store.isOpen ? "open" : "closed"}`}
            disabled={store.mutationPending || store.loading || store.stale}
            onClick={askToggle}
          >
            {store.isOpen ? "Requests enabled" : "Requests paused"}
          </button>
          <button
            className="merchant-button secondary"
            onClick={() => store.fetchQueue()}
            disabled={store.loading}
          >
            Refresh
          </button>
        </div>
      </header>
      {!outlet ? (
        <div className="merchant-card merchant-empty">
          <p>Create an outlet to start operating a queue.</p>
          <button
            className="merchant-button"
            onClick={() => router.push("/dashboard/outlets")}
          >
            Open outlets
          </button>
        </div>
      ) : (
        <>
          {store.error ? (
            <div
              role="alert"
              className="merchant-card"
              style={{
                padding: "12px 16px",
                marginBottom: 16,
                color: "var(--danger)",
              }}
            >
              {store.error}{" "}
              <button
                className="merchant-button quiet"
                onClick={() => store.fetchQueue()}
              >
                Retry
              </button>
            </div>
          ) : null}
          <section
            className="merchant-card merchant-call-band"
            aria-live="polite"
          >
            <div>
              <div className="merchant-kicker">Current call</div>
              {called ? (
                <>
                  <div className="merchant-call-token">
                    {String(called.tokenNumber).padStart(3, "0")}
                  </div>
                  <h2>Called to the counter</h2>
                  <p>Finish this customer before calling another.</p>
                </>
              ) : waiting.length ? (
                <>
                  <h2>Ready for the next customer</h2>
                  <p>
                    Token {String(waiting[0].tokenNumber).padStart(3, "0")} is
                    first in the confirmed queue.
                  </p>
                </>
              ) : (
                <>
                  <h2>No customer to call yet</h2>
                  <p>Accept a request or wait for a confirmed customer.</p>
                </>
              )}
            </div>
            <div className="merchant-call-actions">
              {called ? (
                <>
                  <button
                    className="merchant-button"
                    disabled={
                      store.mutationPending || store.loading || store.stale
                    }
                    onClick={markServed}
                  >
                    <Ic.Check size={16} /> Mark served
                  </button>
                  <button
                    className="merchant-button quiet"
                    disabled={
                      store.mutationPending || store.loading || store.stale
                    }
                    onClick={markMissed}
                  >
                    Mark missed
                  </button>
                </>
              ) : (
                <button
                  className="merchant-button"
                  disabled={
                    !waiting.length ||
                    store.mutationPending ||
                    store.loading ||
                    store.stale
                  }
                  onClick={callNext}
                >
                  Call next <Ic.Arrow size={16} />
                </button>
              )}
            </div>
          </section>
          <div className="merchant-tabbar">
            <button
              className={tab === "requests" ? "is-active" : ""}
              onClick={() => setTab("requests")}
            >
              New requests{" "}
              <span className="merchant-count">{pending.length}</span>
            </button>
            <button
              className={tab === "waiting" ? "is-active" : ""}
              onClick={() => setTab("waiting")}
            >
              Waiting <span className="merchant-count">{waiting.length}</span>
            </button>
          </div>
          <div className="merchant-queue-grid">
            <section
              className={`merchant-card merchant-queue-panel ${tab === "requests" ? "is-visible" : "is-tab-hidden"}`}
            >
              <div className="merchant-panel-heading">
                <div>
                  <h2>New requests</h2>
                  <p>Review each request before it enters the waiting line.</p>
                </div>
                <span className="merchant-count">{pending.length}</span>
              </div>
              {pending.length ? (
                pending.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    kind="request"
                    disabled={
                      store.mutationPending || store.loading || store.stale
                    }
                    onAccept={() =>
                      void store.acceptEntry(entry.id).catch(() => undefined)
                    }
                    onReject={() => {
                      if (
                        window.confirm(
                          `Decline token ${entry.tokenNumber}? This cannot be undone.`,
                        )
                      )
                        void store.rejectEntry(entry.id).catch(() => undefined);
                    }}
                  />
                ))
              ) : (
                <div className="merchant-empty">
                  No requests need your attention.
                </div>
              )}
            </section>
            <section
              className={`merchant-card merchant-queue-panel ${tab === "waiting" ? "is-visible" : "is-tab-hidden"}`}
            >
              <div className="merchant-panel-heading">
                <div>
                  <h2>Waiting</h2>
                  <p>Confirmed customers ordered by the server.</p>
                </div>
                <span className="merchant-count">{waiting.length}</span>
              </div>
              {waiting.length ? (
                waiting.map((entry, index) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    kind="waiting"
                    disabled={
                      store.mutationPending || store.loading || store.stale
                    }
                    onRemove={
                      index === 0 || entry.status === "WAITING"
                        ? () => {
                            if (
                              window.confirm(
                                `Remove token ${entry.tokenNumber} from the queue?`,
                              )
                            )
                              void store
                                .rejectEntry(entry.id)
                                .catch(() => undefined);
                          }
                        : undefined
                    }
                  />
                ))
              ) : (
                <div className="merchant-empty">
                  No confirmed customers are waiting.
                </div>
              )}
            </section>
          </div>
        </>
      )}
      <style jsx>{`
        @media (min-width: 1100px) {
          .merchant-tabbar {
            display: none;
          }
          .is-tab-hidden {
            display: block;
          }
        }
        @media (max-width: 1099px) {
          .is-tab-hidden {
            display: none;
          }
          .is-visible {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

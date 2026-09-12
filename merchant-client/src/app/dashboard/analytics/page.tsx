"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";

type HistoryEntry = {
  id: string;
  tokenNumber: number;
  status: string;
  createdAt: string;
  calledAt?: string | null;
  servedAt?: string | null;
};
const active = new Set(["PENDING_ACCEPTANCE", "WAITING", "CALLED"]);

export default function ActivityPage() {
  const { merchantProfile } = useAuthStore();
  const store = useQueueStore();
  const [outletId, setOutletId] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const readVersion = useRef(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const query =
      new URLSearchParams(window.location.search).get("outletId") || "";
    setOutletId(query || store.selectedOutletId || store.outlets[0]?.id || "");
  }, [store.outlets, store.selectedOutletId]);
  const load = async () => {
    const version = ++readVersion.current;
    if (!outletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setEntries([]);
    try {
      const response = await api.get(`/queue/outlet/${outletId}/history`);
      if (version === readVersion.current) setEntries(response.data.data || []);
    } catch {
      if (version === readVersion.current) setError("Today's activity could not be loaded");
    } finally {
      if (version === readVersion.current) setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    return () => { readVersion.current += 1; };
  }, [outletId]);
  const outlet = store.outlets.find((item) => item.id === outletId);
  const bins = useMemo(() => {
    const values = Array.from({ length: 24 }, () => 0);
    const zone = (outlet as any)?.timezone || "Asia/Kolkata";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      hourCycle: "h23",
    });
    entries.forEach((entry) => {
      const hour = Number(formatter.format(new Date(entry.createdAt)));
      if (hour >= 0 && hour < 24) values[hour] += 1;
    });
    return values;
  }, [entries, outlet]);
  const counts = {
    created: entries.length,
    served: entries.filter((entry) => entry.status === "SERVED").length,
    notCompleted: entries.filter(
      (entry) => entry.status === "MISSED" || entry.status === "CANCELLED",
    ).length,
    active: entries.filter((entry) => active.has(entry.status)).length,
  };
  const max = Math.max(...bins, 1);
  if (!merchantProfile) return null;
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 1120, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Activity</div>
          <h1>Today's requests.</h1>
          <p>
            {outlet?.name || "Selected outlet"} · Includes requests created
            today in this outlet's timezone.
          </p>
        </div>
        <div className="merchant-scope">
          <label htmlFor="activity-outlet">Outlet</label>
          <select
            id="activity-outlet"
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
          <button className="merchant-button quiet" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="merchant-card merchant-empty">
          Loading today's activity…
        </div>
      ) : error ? null : (
        <>
          <div className="merchant-stat-grid">
            <Stat label="Created today" value={counts.created} />
            <Stat label="Served" value={counts.served} />
            <Stat label="Not completed" value={counts.notCompleted} />
            <Stat label="Still active" value={counts.active} />
          </div>
          <section
            className="merchant-card merchant-queue-panel"
            style={{ marginTop: 18 }}
          >
            <div className="merchant-panel-heading">
              <div>
                <h2>Requests by hour</h2>
                <p>24 local hour bins. Every returned request is counted.</p>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(24, minmax(7px, 1fr))",
                alignItems: "end",
                gap: 5,
                minHeight: 190,
                padding: "20px 0 0",
              }}
              aria-label="Requests by hour chart"
            >
              {bins.map((value, hour) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateRows: "18px 1fr 18px",
                    height: 170,
                    alignItems: "end",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {value || ""}
                  </span>
                  <span
                    style={{
                      display: "block",
                      height: `${value ? Math.max(8, (value / max) * 125) : 2}px`,
                      background: "var(--brand)",
                      borderRadius: "4px 4px 1px 1px",
                    }}
                    title={`${value} requests at ${String(hour).padStart(2, "0")}:00`}
                  />
                  <span style={{ fontSize: 9, color: "var(--text-subtle)" }}>
                    {hour % 3 === 0 ? `${String(hour).padStart(2, "0")}h` : ""}
                  </span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Requests by creation hour</caption>
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {bins.map((value, hour) => (
                  <tr key={hour}>
                    <td>{hour}:00</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section
            className="merchant-card merchant-queue-panel"
            style={{ marginTop: 18 }}
          >
            <div className="merchant-panel-heading">
              <div>
                <h2>Request history</h2>
                <p>Created, called and served timestamps where available.</p>
              </div>
            </div>
            {entries.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{ textAlign: "left", color: "var(--text-muted)" }}
                    >
                      <th style={{ padding: "8px 0" }}>Token</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Called</th>
                      <th>Served</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <td style={{ padding: "11px 0", fontWeight: 600 }}>
                          {String(entry.tokenNumber).padStart(3, "0")}
                        </td>
                        <td>{entry.status.replace("_", " ")}</td>
                        <td>{format(entry.createdAt)}</td>
                        <td>{entry.calledAt ? format(entry.calledAt) : "—"}</td>
                        <td>{entry.servedAt ? format(entry.servedAt) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="merchant-empty">
                No requests were created today.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <section
      className="merchant-card merchant-queue-panel"
      style={{ padding: 18 }}
    >
      <span
        className="merchant-kicker"
        style={{ color: "var(--brand-strong)" }}
      >
        {label}
      </span>
      <strong
        style={{ display: "block", marginTop: 8, fontSize: 30, lineHeight: 1 }}
      >
        {value}
      </strong>
    </section>
  );
}
function format(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

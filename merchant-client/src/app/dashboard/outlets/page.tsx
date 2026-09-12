"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@spotly/ui";
import type { Outlet } from "@spotly/types";
import { useQueueStore } from "@/store/queue.store";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function OutletsPage() {
  const router = useRouter();
  const { merchantProfile } = useAuthStore();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    openTime: "09:00",
    closeTime: "21:00",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!merchantProfile?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/outlet/merchant/${merchantProfile.id}`);
      setOutlets(response.data.data || []);
    } catch {
      setError("Outlets could not be loaded");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [merchantProfile?.id]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantProfile?.id) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/outlet", {
        merchantId: merchantProfile.id,
        ...form,
      });
      const outlet = response.data.data;
      setOutlets((current) => [outlet, ...current]);
      await useQueueStore.getState().fetchOutlets(merchantProfile.id);
      setForm({ name: "", address: "", openTime: "09:00", closeTime: "21:00" });
      (
        document.getElementById("outlet-dialog") as HTMLDialogElement | null
      )?.close();
    } catch (cause: any) {
      setError(cause?.message || "Outlet could not be created");
    } finally {
      setSaving(false);
    }
  };
  if (!merchantProfile) return null;
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 1080, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Outlets</div>
          <h1>Every location, in focus.</h1>
          <p>
            Select the place your team is operating. Queue state stays scoped to
            that outlet.
          </p>
        </div>
        <button
          className="merchant-button"
          onClick={() =>
            (
              document.getElementById(
                "outlet-dialog",
              ) as HTMLDialogElement | null
            )?.showModal()
          }
        >
          <Ic.Plus size={15} /> Add outlet
        </button>
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
        <div className="merchant-card merchant-empty">Loading outlets…</div>
      ) : outlets.length === 0 ? (
        <div className="merchant-card merchant-empty">
          <h2>No outlets yet.</h2>
          <p>Create your first location to open a queue.</p>
          <button
            className="merchant-button"
            onClick={() =>
              (
                document.getElementById(
                  "outlet-dialog",
                ) as HTMLDialogElement | null
              )?.showModal()
            }
          >
            Add your first outlet
          </button>
        </div>
      ) : (
        <div className="merchant-list">
          {outlets.map((outlet) => (
            <article
              className="merchant-card merchant-list-row"
              key={outlet.id}
            >
              <div>
                <h2>{outlet.name}</h2>
                <p>{outlet.address || "No address added"}</p>
              </div>
              <div className="merchant-list-actions">
                <span
                  className={`merchant-status ${outlet.isActive ? "open" : "closed"}`}
                >
                  {outlet.isActive ? "Requests enabled" : "Requests paused"}
                </span>
                <button
                  className="merchant-button"
                  onClick={() =>
                    router.push(
                      `/dashboard?outletId=${encodeURIComponent(outlet.id)}`,
                    )
                  }
                >
                  Open queue
                </button>
                <button
                  className="merchant-button secondary"
                  onClick={() =>
                    router.push(
                      `/dashboard/outlets/detail?id=${encodeURIComponent(outlet.id)}`,
                    )
                  }
                >
                  Edit details
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <dialog
        aria-label="Add an outlet"
        id="outlet-dialog"
        className="merchant-card"
        style={{
          width: "min(500px, calc(100vw - 32px))",
          padding: 24,
          border: "1px solid var(--border)",
        }}
      >
        <form onSubmit={create}>
          <div className="merchant-panel-heading">
            <div>
              <div className="merchant-kicker">New outlet</div>
              <h2>Add a location</h2>
            </div>
            <button
              type="button"
              className="merchant-button quiet"
              onClick={() =>
                (
                  document.getElementById(
                    "outlet-dialog",
                  ) as HTMLDialogElement | null
                )?.close()
              }
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {error ? (
            <p role="alert" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}
          <div className="merchant-form-grid">
            <div className="merchant-field full">
              <label htmlFor="outlet-name">Name</label>
              <input
                id="outlet-name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Main outlet"
              />
            </div>
            <div className="merchant-field full">
              <label htmlFor="outlet-address">Address</label>
              <textarea
                id="outlet-address"
                required
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="Street, city"
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="outlet-open">Opening time</label>
              <input
                id="outlet-open"
                type="time"
                value={form.openTime}
                onChange={(event) =>
                  setForm({ ...form, openTime: event.target.value })
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="outlet-close">Closing time</label>
              <input
                id="outlet-close"
                type="time"
                value={form.closeTime}
                onChange={(event) =>
                  setForm({ ...form, closeTime: event.target.value })
                }
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="merchant-button secondary"
              onClick={() =>
                (
                  document.getElementById(
                    "outlet-dialog",
                  ) as HTMLDialogElement | null
                )?.close()
              }
            >
              Cancel
            </button>
            <button type="submit" className="merchant-button" disabled={saving}>
              {saving ? "Saving…" : "Create outlet"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

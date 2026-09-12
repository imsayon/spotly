"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Ic } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";
import api from "@/lib/api";
import { env } from "@/lib/env";

type OutletDetail = {
  id: string;
  merchantId: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
  openTime?: string;
  closeTime?: string;
  timezone?: string;
};

export default function OutletDetailPage() {
  const router = useRouter();
  const merchantProfile = useAuthStore((state) => state.merchantProfile);
  const [id, setId] = useState("");
  const [outlet, setOutlet] = useState<OutletDetail | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    openTime: "09:00",
    closeTime: "21:00",
  });
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("id") || "";
    setId(value);
    if (!value) setLoading(false);
  }, []);
  const shareUrl = useMemo(
    () =>
      outlet
        ? `${env.NEXT_PUBLIC_CONSUMER_URL}/merchant?id=${encodeURIComponent(outlet.merchantId)}&outletId=${encodeURIComponent(outlet.id)}`
        : "",
    [outlet],
  );
  useEffect(() => {
    if (shareUrl)
      void QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
        .then(setQr)
        .catch(() => setQr(""));
  }, [shareUrl]);
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    api
      .get(`/outlet/${id}`)
      .then((response) => {
        if (!mounted) return;
        const value = response.data.data;
        if (value.merchantId !== merchantProfile?.id) throw new Error("Outlet not owned by this business");
        setOutlet(value);
        setForm({
          name: value.name || "",
          address: value.address || "",
          lat: value.lat == null ? "" : String(value.lat),
          lng: value.lng == null ? "" : String(value.lng),
          openTime: value.openTime || "09:00",
          closeTime: value.closeTime || "21:00",
        });
      })
      .catch(() => {
        if (mounted) setError("Outlet could not be loaded");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, merchantProfile?.id]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!outlet) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/outlet/${outlet.id}`, {
        name: form.name.trim(),
        address: form.address.trim(),
        lat: form.lat === "" ? undefined : Number(form.lat),
        lng: form.lng === "" ? undefined : Number(form.lng),
        openTime: form.openTime,
        closeTime: form.closeTime,
      });
      setOutlet((value) =>
        value ? { ...value, ...response.data.data } : value,
      );
      setNotice("Outlet details saved");
    } catch (cause: any) {
      setError(cause?.message || "Outlet could not be saved");
    } finally {
      setSaving(false);
    }
  };
  const toggle = async () => {
    if (!outlet || saving) return;
    if (
      outlet.isActive &&
      !window.confirm(
        "Pause new requests? Existing customers stay in the queue.",
      )
    )
      return;
    setSaving(true);
    try {
      const next = !outlet.isActive;
      await api.patch(`/outlet/${outlet.id}/active?active=${next}`);
      setOutlet({ ...outlet, isActive: next });
      setNotice(next ? "Requests enabled" : "Requests paused");
    } catch (cause: any) {
      setError(cause?.message || "Requests status could not be changed");
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (
      !outlet ||
      !window.confirm(
        `Delete ${outlet.name}? Queue history, services and reviews linked to it may also be removed.`,
      )
    )
      return;
    try {
      await api.delete(`/outlet/${outlet.id}`);
      if (merchantProfile) await useQueueStore.getState().fetchOutlets(merchantProfile.id);
      router.replace("/dashboard/outlets");
    } catch (cause: any) {
      setError(
        cause?.message ||
          "Outlet cannot be deleted while it is open or has active queue entries",
      );
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Outlet link copied");
    } catch {
      setNotice("Copy failed. Select the link below to copy it manually.");
    }
  };

  if (loading) return <div className="merchant-empty">Loading outlet…</div>;
  if (!outlet)
    return (
      <div className="merchant-empty">
        <h2>Outlet unavailable</h2>
        <button
          className="merchant-button"
          onClick={() => router.push("/dashboard/outlets")}
        >
          Back to outlets
        </button>
      </div>
    );
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 1080, margin: "0 auto" }}
    >
      <button
        className="merchant-button quiet"
        onClick={() => router.push("/dashboard/outlets")}
      >
        <Ic.ChevL size={15} /> Outlets
      </button>
      <header className="merchant-page-heading" style={{ marginTop: 12 }}>
        <div>
          <div className="merchant-kicker">Outlet details</div>
          <h1>{outlet.name}</h1>
          <p>{outlet.address || "Add an address customers can recognize."}</p>
        </div>
        <button
          className={`merchant-status ${outlet.isActive ? "open" : "closed"}`}
          disabled={saving}
          onClick={toggle}
        >
          {outlet.isActive ? "Requests enabled" : "Requests paused"}
        </button>
      </header>
      {error ? (
        <div
          role="alert"
          className="merchant-card"
          style={{ padding: 14, marginBottom: 14, color: "var(--danger)" }}
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="merchant-card"
          style={{ padding: 14, marginBottom: 14, color: "var(--success)" }}
        >
          {notice}
        </div>
      ) : null}
      <div className="merchant-queue-grid">
        <form className="merchant-card merchant-queue-panel" onSubmit={save}>
          <div className="merchant-panel-heading">
            <div>
              <h2>Details</h2>
              <p>Timezone: {outlet.timezone || "Asia/Kolkata"} (read-only)</p>
            </div>
          </div>
          <div className="merchant-form-grid">
            <div className="merchant-field full">
              <label htmlFor="detail-name">Outlet name</label>
              <input
                id="detail-name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </div>
            <div className="merchant-field full">
              <label htmlFor="detail-address">Address</label>
              <textarea
                id="detail-address"
                required
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="detail-lat">Latitude (optional)</label>
              <input
                id="detail-lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.lat}
                onChange={(event) =>
                  setForm({ ...form, lat: event.target.value })
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="detail-lng">Longitude (optional)</label>
              <input
                id="detail-lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.lng}
                onChange={(event) =>
                  setForm({ ...form, lng: event.target.value })
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="detail-open">Opening time</label>
              <input
                id="detail-open"
                type="time"
                value={form.openTime}
                onChange={(event) =>
                  setForm({ ...form, openTime: event.target.value })
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="detail-close">Closing time</label>
              <input
                id="detail-close"
                type="time"
                value={form.closeTime}
                onChange={(event) =>
                  setForm({ ...form, closeTime: event.target.value })
                }
              />
            </div>
          </div>
          <button
            className="merchant-button"
            type="submit"
            disabled={saving}
            style={{ marginTop: 20 }}
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </form>
        <aside id="sharing" className="merchant-card merchant-queue-panel">
          <div className="merchant-panel-heading">
            <div>
              <h2>Share this outlet</h2>
              <p>Customers open the selected outlet directly.</p>
            </div>
          </div>
          {qr ? (
            <img
              src={qr}
              alt="QR code for this outlet"
              width={220}
              height={220}
              style={{ display: "block", margin: "0 auto 16px" }}
            />
          ) : null}
          {qr ? (
            <a
              className="merchant-button secondary"
              href={qr}
              download="spotly-outlet-qr.png"
            >
              Download QR
            </a>
          ) : null}
          <button className="merchant-button" onClick={copy}>
            Copy outlet link
          </button>
          <input
            readOnly
            value={shareUrl}
            aria-label="Outlet link"
            style={{ marginTop: 12 }}
          />
          {shareUrl ? (
            <a
              className="merchant-button secondary"
              style={{ marginTop: 10 }}
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open customer view <Ic.Arrow size={15} />
            </a>
          ) : null}
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}
          >
            <button
              className="merchant-button secondary"
              onClick={() =>
                router.push(
                  `/dashboard/inventory?outletId=${encodeURIComponent(outlet.id)}`,
                )
              }
            >
              Services
            </button>
            <button
              className="merchant-button secondary"
              onClick={() =>
                router.push(
                  `/dashboard/settings/reviews?outletId=${encodeURIComponent(outlet.id)}`,
                )
              }
            >
              Reviews
            </button>
          </div>
        </aside>
      </div>
      <section
        className="merchant-card merchant-queue-panel"
        style={{
          marginTop: 18,
          borderColor: "color-mix(in srgb,var(--danger) 30%,var(--border))",
        }}
      >
        <div className="merchant-panel-heading">
          <div>
            <h2>Delete outlet</h2>
            <p>
              Pause requests and finish active customers before deleting. This
              removes linked queue history, services and reviews according to
              the current database cascade.
            </p>
          </div>
          <button
            className="merchant-button danger"
            onClick={remove}
            disabled={outlet.isActive}
          >
            Delete outlet
          </button>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { Ic, useToasts } from "@spotly/ui";
import api from "@/lib/api";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="consumer-profile-map-loading">Loading map…</div>
  ),
});

type Visit = {
  id: string;
  tokenNumber: number;
  status: string;
  createdAt: string;
  outlet?: {
    id?: string;
    merchantId?: string;
    name?: string;
    address?: string;
    merchant?: { id?: string; name?: string };
  };
};

export default function ConsumerProfile() {
  const { user, profile, updateProfile, fetchProfile, signOut } =
    useAuthStore();
  const { add } = useToasts();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Visit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    location: string;
    lat?: number;
    lng?: number;
  }>({ name: "", phone: "", location: "" });

  const loadHistory = () => {
    if (!user) return;
    setHistoryError(false);
    setHistoryLoading(true);
    api
      .get("/queue/history?limit=20")
      .then((response) => setHistory(response.data.data || []))
      .catch(() => setHistoryError(true))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (editing) return;
    setForm({
      name: profile?.name || user?.email?.split("@")[0] || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      lat: profile?.lat ?? undefined,
      lng: profile?.lng ?? undefined,
    });
  }, [editing, profile, user?.email]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setHistoryError(false);
      return;
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      add("Enter your name before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      });
      await fetchProfile();
      setEditing(false);
      add("Profile updated", "success");
    } catch (cause: any) {
      add(cause?.message || "Profile could not be updated", "error");
    } finally {
      setSaving(false);
    }
  };

  const label = profile?.name || user?.email?.split("@")[0] || "Account";
  if (!user)
    return (
      <div className="consumer-page">
        <header className="consumer-page-heading">
          <div>
            <div className="consumer-kicker">Account</div>
            <h1 className="consumer-editorial">Keep your details useful.</h1>
            <p>
              Your email is your identity. Phone and location are optional
              profile details.
            </p>
          </div>
        </header>
        <div className="consumer-empty-state">
          <Ic.User size={24} />
          <h2>Sign in to manage your account.</h2>
          <p>Sign in to edit your details and review your visit history.</p>
          <Link
            className="consumer-button"
            href="/auth/sign-in?returnTo=%2Fhome%2Fprofile"
          >
            Sign in
          </Link>
          <Link className="consumer-button quiet" href="/home">
            Discover places
          </Link>
        </div>
      </div>
    );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (cause: any) {
      add(cause?.message || "Sign out could not be completed", "error");
    }
  };

  return (
    <div className="consumer-page">
      <header className="consumer-page-heading">
        <div>
          <div className="consumer-kicker">Account</div>
          <h1 className="consumer-editorial">Keep your details useful.</h1>
          <p>
            Your email is your identity. Phone and location are optional profile
            details.
          </p>
        </div>
        <span className="consumer-status">
          <Ic.User size={14} /> Consumer
        </span>
      </header>
      <section
        className="consumer-card"
        style={{ padding: 24, marginBottom: 22 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            className="consumer-place-logo"
            style={{ width: 58, height: 58, borderRadius: "50%" }}
          >
            {label[0]?.toUpperCase()}
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{label}</h2>
            <p style={{ margin: "3px 0 0", color: "var(--text-secondary)" }}>
              {user.email}
            </p>
          </div>
          <button
            className="consumer-button secondary"
            style={{ marginLeft: "auto" }}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Close" : "Edit profile"}
          </button>
        </div>
        {editing ? (
          <form
            onSubmit={save}
            className="consumer-form-grid"
            style={{ marginTop: 22 }}
          >
            <label className="consumer-field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                autoComplete="name"
              />
            </label>
            <label className="consumer-field">
              <span>Phone (optional)</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                autoComplete="tel"
              />
            </label>
            <label className="consumer-field full">
              <span>Location (optional)</span>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
              />
            </label>
            <details className="consumer-profile-location">
              <summary>Optional map pin</summary>
              <p>
                Select a point to save coordinates with your profile. Location
                access is never requested automatically.
              </p>
              <MapPicker
                lat={form.lat}
                lng={form.lng}
                onSelect={(lat, lng, address) =>
                  setForm((current) => ({
                    ...current,
                    lat,
                    lng,
                    location: address || current.location,
                  }))
                }
              />
            </details>
            <button className="consumer-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        ) : null}
      </section>
      <section className="consumer-section">
        <div className="consumer-section-heading">
          <h2>Recent visits</h2>
          <span>{history.length} records</span>
        </div>
        {historyLoading ? (
          <p role="status">Loading your visits…</p>
        ) : historyError ? (
          <div className="consumer-empty-state">
            <h2>History could not be loaded.</h2>
            <p>
              Your profile is still available. Try the history request again.
            </p>
            <button className="consumer-button" onClick={loadHistory}>
              Retry history
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="consumer-empty-state">
            <h2>No visits yet.</h2>
            <p>Your completed and closed queue requests will appear here.</p>
          </div>
        ) : (
          <div className="consumer-place-list">
            {history.map((visit) => {
              const merchantId =
                visit.outlet?.merchantId || visit.outlet?.merchant?.id;
              const outletId = visit.outlet?.id;
              const reviewHref =
                merchantId && outletId
                  ? `/merchant?id=${encodeURIComponent(merchantId)}&outletId=${encodeURIComponent(outletId)}#reviews`
                  : "";
              return (
                <div
                  className="consumer-place-row"
                  key={visit.id}
                  style={{ cursor: "default" }}
                >
                  <span
                    className="consumer-place-logo"
                    style={{ width: 44, height: 44, fontSize: 15 }}
                  >
                    #{String(visit.tokenNumber).padStart(3, "0")}
                  </span>
                  <span className="consumer-place-copy">
                    <h2>{visit.outlet?.merchant?.name || "Spotly visit"}</h2>
                    <p>
                      {visit.outlet?.name || "Outlet"} ·{" "}
                      {visit.status.replace("_", " ")}
                    </p>
                    <small>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(visit.createdAt))}
                    </small>
                  </span>
                  <span className="consumer-place-actions">
                    <Link
                      className="consumer-button quiet"
                      href={`/home/queue?entryId=${encodeURIComponent(visit.id)}`}
                    >
                      View ticket
                    </Link>
                    {reviewHref ? (
                      <Link className="consumer-button quiet" href={reviewHref}>
                        Review outlet
                      </Link>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section
        className="consumer-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          padding: 20,
        }}
      >
        <div>
          <div className="consumer-kicker">Account access</div>
          <p style={{ margin: "5px 0 0", color: "var(--text-secondary)" }}>
            Manage your password or leave this device.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <Link
            className="consumer-button secondary"
            href="/auth/reset?returnTo=%2Fhome%2Fprofile"
          >
            Reset password
          </Link>
          <button className="consumer-button quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

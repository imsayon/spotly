"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

type Form = {
  name: string;
  category: string;
  description: string;
  phone: string;
  contactEmail: string;
  website: string;
  address: string;
  foundingYear: string;
  gstNumber: string;
};

export default function BusinessPage() {
  const { merchantProfile, setMerchantProfile } = useAuthStore();
  const [form, setForm] = useState<Form>({
    name: "",
    category: "",
    description: "",
    phone: "",
    contactEmail: "",
    website: "",
    address: "",
    foundingYear: "",
    gstNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!merchantProfile) return;
    setForm({
      name: merchantProfile.name || "",
      category: merchantProfile.category || "",
      description: merchantProfile.description || "",
      phone: merchantProfile.phone || "",
      contactEmail: merchantProfile.contactEmail || "",
      website: merchantProfile.website || "",
      address: merchantProfile.address || "",
      foundingYear: merchantProfile.foundingYear
        ? String(merchantProfile.foundingYear)
        : "",
      gstNumber: merchantProfile.gstNumber || "",
    });
  }, [merchantProfile]);
  const set = (key: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!merchantProfile) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await api.patch("/merchant/me", {
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        contactEmail: form.contactEmail || undefined,
        website: form.website || undefined,
        address: form.address.trim(),
        foundingYear: form.foundingYear ? Number(form.foundingYear) : undefined,
        gstNumber: form.gstNumber.trim(),
      });
      setMerchantProfile({ ...merchantProfile, ...response.data.data });
      setMessage("Business details saved");
    } catch (cause: any) {
      setError(cause?.message || "Business details could not be saved");
    } finally {
      setSaving(false);
    }
  };
  if (!merchantProfile) return null;
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 980, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Business details</div>
          <h1>Make your profile easy to trust.</h1>
          <p>
            Business-wide information stays separate from each outlet's address,
            hours and queue.
          </p>
        </div>
        {merchantProfile.verified ? (
          <span className="merchant-status open">Verified</span>
        ) : null}
      </header>
      {message ? (
        <div
          role="status"
          className="merchant-card"
          style={{ padding: 14, marginBottom: 14, color: "var(--success)" }}
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="merchant-card"
          style={{ padding: 14, marginBottom: 14, color: "var(--danger)" }}
        >
          {error}
        </div>
      ) : null}
      <form className="merchant-card merchant-queue-panel" onSubmit={save}>
        <div className="merchant-form-grid">
          <div className="merchant-field">
            <label htmlFor="business-name">Business name</label>
            <input
              id="business-name"
              required
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-category">Category</label>
            <input
              id="business-category"
              required
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
            />
          </div>
          <div className="merchant-field full">
            <label htmlFor="business-description">Description</label>
            <textarea
              id="business-description"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-phone">Phone</label>
            <input
              id="business-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-email">Contact email</label>
            <input
              id="business-email"
              type="email"
              value={form.contactEmail}
              onChange={(event) => set("contactEmail", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-website">Website</label>
            <input
              id="business-website"
              type="url"
              value={form.website}
              onChange={(event) => set("website", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-year">Founding year</label>
            <input
              id="business-year"
              min="1800"
              max={new Date().getFullYear()}
              type="number"
              step="1"
              value={form.foundingYear}
              onChange={(event) => set("foundingYear", event.target.value)}
            />
          </div>
          <div className="merchant-field full">
            <label htmlFor="business-address">Business address</label>
            <textarea
              id="business-address"
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
          <div className="merchant-field">
            <label htmlFor="business-gst">GST number (optional)</label>
            <input
              id="business-gst"
              value={form.gstNumber}
              onChange={(event) => set("gstNumber", event.target.value)}
            />
          </div>
        </div>
        <button
          className="merchant-button"
          type="submit"
          disabled={saving}
          style={{ marginTop: 22 }}
        >
          {saving ? "Saving…" : "Save business details"}
        </button>
      </form>
    </div>
  );
}

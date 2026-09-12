"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@spotly/ui";
import type { MenuCategory, MenuItem } from "@spotly/types";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";

type Draft = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
};

export default function ServicesPage() {
  const router = useRouter();
  const { merchantProfile } = useAuthStore();
  const store = useQueueStore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [outletId, setOutletId] = useState("");

  useEffect(() => {
    const queryOutlet =
      new URLSearchParams(window.location.search).get("outletId") || "";
    setOutletId(queryOutlet || store.selectedOutletId);
  }, [store.selectedOutletId]);
  useEffect(() => {
    if (!outletId && store.outlets[0]) setOutletId(store.outlets[0].id);
  }, [outletId, store.outlets]);
  useEffect(() => {
    if (!outletId) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    setError("");
    api
      .get(`/menu/outlet/${outletId}`)
      .then((response) => {
        if (mounted) setCategories(response.data.data || []);
      })
      .catch(() => {
        if (mounted) setError("Services could not be loaded");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [outletId]);

  const selectedOutlet = store.outlets.find((outlet) => outlet.id === outletId);
  const items = useMemo(
    () => categories.flatMap((category) => category.items || []),
    [categories],
  );
  const reload = async () => {
    if (!outletId) return;
    const response = await api.get(`/menu/outlet/${outletId}`);
    setCategories(response.data.data || []);
  };
  const updateDraft = (key: keyof Draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const createCategory = async () => {
    const name = window.prompt("Category name")?.trim();
    if (!name || !outletId) return;
    try {
      await api.post("/menu/category", { outletId, name });
      await reload();
    } catch {
      setError("Category could not be created");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...emptyDraft, categoryId: categories[0]?.id || "" });
    (
      document.getElementById("service-dialog") as HTMLDialogElement | null
    )?.showModal();
  };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDraft({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      categoryId: item.categoryId,
    });
    (
      document.getElementById("service-dialog") as HTMLDialogElement | null
    )?.showModal();
  };
  const closeDialog = () =>
    (
      document.getElementById("service-dialog") as HTMLDialogElement | null
    )?.close();

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const name = draft.name.trim();
    const price = Number(draft.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      setError("Enter a service name and a non-negative price.");
      return;
    }
    setSaving(true);
    try {
      if (editing)
        await api.patch(`/menu/item/${editing.id}`, {
          name,
          description: draft.description,
          price,
        });
      else {
        let categoryId = draft.categoryId;
        if (!categoryId) {
          const categoryResponse = await api.post("/menu/category", {
            outletId,
            name: "General",
          });
          categoryId = categoryResponse.data.data.id;
        }
        await api.post("/menu/item", {
          categoryId,
          name,
          description: draft.description,
          price,
          isAvailable: true,
        });
      }
      await reload();
      closeDialog();
    } catch (cause: any) {
      setError(cause?.message || "Service could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: MenuItem) => {
    try {
      await api.patch(
        `/menu/item/${item.id}/availability?available=${!item.isAvailable}`,
      );
      await reload();
    } catch {
      setError("Availability could not be updated");
    }
  };
  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.delete(`/menu/item/${item.id}`);
      await reload();
    } catch {
      setError("Service could not be deleted");
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
          <div className="merchant-kicker">Services</div>
          <h1>Keep your offerings clear.</h1>
          <p>
            {selectedOutlet?.name || "Select an outlet"} · Add real prices and
            descriptions customers can trust.
          </p>
        </div>
        <div className="merchant-scope">
          <label htmlFor="services-outlet">Outlet</label>
          <select
            id="services-outlet"
            value={outletId}
            onChange={(event) => {
              setOutletId(event.target.value);
              router.replace(
                `/dashboard/inventory?outletId=${encodeURIComponent(event.target.value)}`,
              );
            }}
          >
            {store.outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
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
          {error}
        </div>
      ) : null}
      <div
        style={{ display: "flex", gap: 9, marginBottom: 20, flexWrap: "wrap" }}
      >
        <button
          className="merchant-button"
          onClick={openCreate}
          disabled={!outletId}
        >
          Add service <Ic.Plus size={15} />
        </button>
        <button
          className="merchant-button secondary"
          onClick={createCategory}
          disabled={!outletId}
        >
          Add category
        </button>
      </div>
      {!selectedOutlet ? <div className="merchant-empty">Choose an available outlet to manage its services.</div> : loading ? (
        <div className="merchant-card merchant-empty">Loading services…</div>
      ) : categories.length === 0 && items.length === 0 ? (
        <div className="merchant-card merchant-empty">
          <p>No services yet. Add a real service after choosing a category.</p>
          <button className="merchant-button" onClick={openCreate}>
            Add your first service
          </button>
        </div>
      ) : (
        <div className="merchant-list">
          {categories.map((category) => (
            <section
              key={category.id}
              className="merchant-card"
              style={{ padding: "20px 22px" }}
            >
              <div className="merchant-panel-heading">
                <div>
                  <h2>{category.name}</h2>
                  <p>{category.items?.length || 0} services</p>
                </div>
              </div>
              {category.items?.length ? (
                category.items.map((item) => (
                  <div
                    className="merchant-list-row"
                    key={item.id}
                    style={{
                      padding: "14px 0",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <h2>{item.name}</h2>
                      <p>
                        {item.description || "No description"} · ₹
                        {Number(item.price).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="merchant-list-actions">
                      <button
                        className={`merchant-status ${item.isAvailable ? "open" : "closed"}`}
                        onClick={() => toggle(item)}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </button>
                      <button
                        className="merchant-button secondary"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="merchant-button danger"
                        onClick={() => remove(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="merchant-empty">
                  No services in this category.
                </div>
              )}
            </section>
          ))}
        </div>
      )}
      <dialog
        aria-label="Service details"
        id="service-dialog"
        className="merchant-card"
        style={{
          width: "min(480px, calc(100vw - 32px))",
          padding: 24,
          border: "1px solid var(--border)",
        }}
      >
        <form method="dialog" onSubmit={save}>
          <div className="merchant-panel-heading">
            <div>
              <div className="merchant-kicker">
                {editing ? "Edit service" : "New service"}
              </div>
              <h2>{editing ? editing.name : "Add a service"}</h2>
            </div>
            <button
              className="merchant-button quiet"
              type="button"
              onClick={closeDialog}
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
              <label htmlFor="service-name">Name</label>
              <input
                id="service-name"
                required
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
              />
            </div>
            <div className="merchant-field full">
              <label htmlFor="service-description">
                Description (optional)
              </label>
              <textarea
                id="service-description"
                value={draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
              />
            </div>
            <div className="merchant-field">
              <label htmlFor="service-price">Price (INR)</label>
              <input
                id="service-price"
                required
                min="0"
                step="0.01"
                type="number"
                value={draft.price}
                onChange={(event) => updateDraft("price", event.target.value)}
              />
            </div>
            {!editing ? (
              <div className="merchant-field">
                <label htmlFor="service-category">Category</label>
                <select
                  id="service-category"
                  value={draft.categoryId}
                  onChange={(event) =>
                    updateDraft("categoryId", event.target.value)
                  }
                >
                  <option value="">Create General</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
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
              className="merchant-button secondary"
              type="button"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button className="merchant-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save service"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

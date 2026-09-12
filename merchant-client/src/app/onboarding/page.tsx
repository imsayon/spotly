"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@spotly/ui";
import api from "@/lib/api";
import { useAuthStore, type MerchantProfile } from "@/store/auth.store";

const CATEGORIES = [
  "Grocery",
  "Pharmacy",
  "Food & Beverage",
  "Retail",
  "Salon & Spa",
  "Other",
] as const;
type Category = (typeof CATEGORIES)[number];
type Stage = 1 | 2;
type Saving = "business" | "outlet" | null;

type OutletSummary = {
  id: string;
  name: string;
};

type ApiEnvelope<T> = { data: T };

function messageFor(error: unknown, fallback: string) {
  const cause = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return cause?.response?.data?.message || cause?.message || fallback;
}

function Field({
  label,
  htmlFor,
  children,
  optional = false,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="merchant-onboarding-field">
      <label htmlFor={htmlFor}>
        {label}
        {optional ? <span> (optional)</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    merchantProfile,
    loading: authLoading,
    identityError,
    setUser,
    setMerchantProfile,
  } = useAuthStore();
  const [step, setStep] = useState<Stage>(merchantProfile ? 2 : 1);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [saving, setSaving] = useState<Saving>(null);
  const [error, setError] = useState("");

  const [businessId, setBusinessId] = useState(merchantProfile?.id || "");
  const [businessName, setBusinessName] = useState(merchantProfile?.name || "");
  const [category, setCategory] = useState<Category | "">(
    (merchantProfile?.category as Category) || "",
  );
  const [description, setDescription] = useState(
    merchantProfile?.description || "",
  );

  const [outletName, setOutletName] = useState("");
  const [outletAddress, setOutletAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");

  useEffect(() => {
    if (authLoading) return;
    if (!user)
      router.replace(
        `/auth/sign-in?returnTo=${encodeURIComponent("/onboarding")}`,
      );
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!merchantProfile?.id) return;
    setBusinessId(merchantProfile.id);
    setBusinessName(merchantProfile.name || "");
    setCategory((merchantProfile.category as Category) || "");
    setDescription(merchantProfile.description || "");
    if (!editingBusiness) setStep(2);
    if (merchantProfile.outlets?.length) router.replace("/dashboard");
    // Profile identity changes only when the auth owner changes. Do not overwrite an in-progress edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantProfile?.id]);

  const retryIdentity = () => {
    if (user) void setUser(user).catch(() => undefined);
  };

  const saveBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = businessName.trim();
    const selectedCategory = category.trim();
    if (!name) return setError("Business name is required.");
    if (!selectedCategory) return setError("Choose a category to continue.");
    setSaving("business");
    setError("");
    try {
      let merchant: MerchantProfile | undefined = merchantProfile || undefined;
      if (merchant?.id) {
        const response = await api.patch<ApiEnvelope<MerchantProfile>>(
          "/merchant/me",
          {
            name,
            category: selectedCategory,
            description: description.trim() || undefined,
          },
        );
        merchant = response.data.data;
      } else {
        try {
          const existing =
            await api.get<ApiEnvelope<MerchantProfile>>("/merchant/me");
          merchant = existing.data.data;
        } catch (profileError: unknown) {
          const status = (profileError as { response?: { status?: number } })
            ?.response?.status;
          if (status !== 404) throw profileError;
          try {
            const created = await api.post<ApiEnvelope<MerchantProfile>>(
              "/merchant",
              {
                name,
                category: selectedCategory,
                description: description.trim() || undefined,
              },
            );
            merchant = created.data.data;
          } catch (createError: unknown) {
            // A concurrent tab may have created the one allowed profile. Reuse it rather than posting again.
            if (
              (createError as { response?: { status?: number } })?.response
                ?.status !== 409
            )
              throw createError;
            const recovered =
              await api.get<ApiEnvelope<MerchantProfile>>("/merchant/me");
            merchant = recovered.data.data;
          }
        }
      }
      if (!merchant?.id) throw new Error("Your business could not be saved.");
      setBusinessId(merchant.id);
      setMerchantProfile(merchant);
      setEditingBusiness(false);
      setStep(2);
    } catch (cause: unknown) {
      setError(messageFor(cause, "Business could not be saved. Try again."));
    } finally {
      setSaving(null);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location is not available in this browser. You can enter coordinates manually.",
      );
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(6));
        setLongitude(coords.longitude.toFixed(6));
        setLocationLoading(false);
      },
      () => {
        setLocationError(
          "We could not read your location. Continue with the address or enter coordinates.",
        );
        setLocationLoading(false);
      },
      { timeout: 10000 },
    );
  };

  const createOutlet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = outletName.trim();
    const address = outletAddress.trim();
    if (!businessId)
      return setError("Save your business before creating an outlet.");
    if (!name) return setError("Outlet name is required.");
    if (!address) return setError("Address is required for the first outlet.");
    const lat = latitude.trim() === "" ? undefined : Number(latitude);
    const lng = longitude.trim() === "" ? undefined : Number(longitude);
    if (
      (lat !== undefined && !Number.isFinite(lat)) ||
      (lng !== undefined && !Number.isFinite(lng)) ||
      (lat !== undefined && (lat < -90 || lat > 90)) ||
      (lng !== undefined && (lng < -180 || lng > 180))
    ) {
      return setError(
        "Enter a valid latitude and longitude, or leave both fields empty.",
      );
    }
    if ((lat === undefined) !== (lng === undefined))
      return setError("Enter both map coordinates or leave them empty.");

    setSaving("outlet");
    setError("");
    try {
      const existing = await api.get<ApiEnvelope<OutletSummary[]>>(
        `/outlet/merchant/${businessId}`,
      );
      const alreadyCreated = (existing.data.data || []).some(
        (outlet) => outlet.name.trim() === name,
      );
      if (!alreadyCreated) {
        await api.post("/outlet", {
          merchantId: businessId,
          name,
          address,
          ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
          ...(hoursEnabled ? { openTime, closeTime } : {}),
        });
      }
      const profile =
        merchantProfile ||
        (await api.get<ApiEnvelope<MerchantProfile>>("/merchant/me")).data.data;
      setMerchantProfile(profile);
      router.replace("/dashboard");
    } catch (cause: unknown) {
      setError(
        messageFor(
          cause,
          "Outlet could not be created. Your saved business is safe; try again.",
        ),
      );
    } finally {
      setSaving(null);
    }
  };

  if (authLoading)
    return (
      <div className="merchant-onboarding-loading" role="status">
        Loading your setup…
      </div>
    );
  if (!user)
    return (
      <div className="merchant-onboarding-loading" role="status">
        Returning to sign in…
      </div>
    );
  if (identityError) {
    return (
      <main className="merchant-onboarding-page">
        <div className="merchant-onboarding-header">
          <a className="merchant-onboarding-brand" href="/">
            spotly.<span>/ business</span>
          </a>
        </div>
        <section className="merchant-onboarding-error">
          <h1>Setup is temporarily unavailable.</h1>
          <p>{identityError}</p>
          <button
            className="merchant-button"
            type="button"
            onClick={retryIdentity}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="merchant-onboarding-page">
      <header className="merchant-onboarding-header">
        <a className="merchant-onboarding-brand" href="/">
          spotly.<span>/ business</span>
        </a>
        <div className="merchant-onboarding-header-meta">
          Reach your first useful moment
        </div>
      </header>
      <div className="merchant-onboarding-intro">
        <div className="merchant-kicker">Merchant setup</div>
        <h1>Set up the place your customers will visit.</h1>
        <p>
          Save a business, add one outlet, then open Queue. Services and richer
          profile details can follow later.
        </p>
      </div>
      {error ? (
        <div className="merchant-onboarding-alert" role="alert">
          {error}
        </div>
      ) : null}
      <div className="merchant-onboarding-grid">
        <section
          className={`merchant-onboarding-card ${step === 1 ? "is-current" : "is-complete"}`}
          aria-labelledby="business-step-title"
        >
          <div className="merchant-onboarding-step">SET UP SPOTLY / 1 / 2</div>
          <h2 id="business-step-title">Your business</h2>
          {step === 1 ? (
            <form onSubmit={saveBusiness} className="merchant-onboarding-form">
              <Field label="Business name" htmlFor="onboarding-business-name">
                <input
                  id="onboarding-business-name"
                  required
                  autoComplete="organization"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Corner House"
                />
              </Field>
              <Field label="Category" htmlFor="onboarding-category">
                <select
                  id="onboarding-category"
                  required
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as Category)
                  }
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Description"
                htmlFor="onboarding-description"
                optional
              >
                <textarea
                  id="onboarding-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Tell people about your business"
                />
              </Field>
              <p className="merchant-onboarding-note">
                Save this step before moving on. If outlet creation fails, the
                saved business is retained.
              </p>
              <button
                className="merchant-button merchant-onboarding-submit"
                type="submit"
                disabled={saving !== null}
              >
                {saving === "business" ? "Saving…" : "Continue →"}
              </button>
            </form>
          ) : (
            <div className="merchant-onboarding-complete">
              <div>
                <span className="merchant-onboarding-check">
                  <Ic.Check size={16} />
                </span>
                <strong>{businessName}</strong>
              </div>
              <p>
                {category}
                {description ? ` · ${description}` : ""}
              </p>
              <button
                className="merchant-button secondary"
                type="button"
                onClick={() => {
                  setEditingBusiness(true);
                  setStep(1);
                  setError("");
                }}
              >
                Edit business
              </button>
            </div>
          )}
        </section>

        <section
          className={`merchant-onboarding-card ${step === 2 ? "is-current" : "is-locked"}`}
          aria-labelledby="outlet-step-title"
        >
          <div className="merchant-onboarding-step">SET UP SPOTLY / 2 / 2</div>
          <h2 id="outlet-step-title">Your first outlet</h2>
          {step === 2 ? (
            <form onSubmit={createOutlet} className="merchant-onboarding-form">
              <Field label="Outlet name" htmlFor="onboarding-outlet-name">
                <input
                  id="onboarding-outlet-name"
                  required
                  autoComplete="organization"
                  value={outletName}
                  onChange={(event) => setOutletName(event.target.value)}
                  placeholder="Main outlet"
                />
              </Field>
              <Field label="Address" htmlFor="onboarding-outlet-address">
                <textarea
                  id="onboarding-outlet-address"
                  required
                  autoComplete="street-address"
                  value={outletAddress}
                  onChange={(event) => setOutletAddress(event.target.value)}
                  placeholder="12 Main Street"
                />
              </Field>
              <div
                className="merchant-onboarding-map"
                aria-label="Optional map location"
              >
                <div>
                  <strong>Choose map location</strong>
                  <span>Optional. Or continue with the address above.</span>
                </div>
                <button
                  className="merchant-button secondary"
                  type="button"
                  onClick={captureLocation}
                  disabled={locationLoading}
                >
                  <Ic.MapPin size={16} />
                  {locationLoading
                    ? "Reading location…"
                    : "Use current location"}
                </button>
                <div className="merchant-onboarding-coordinates">
                  <input
                    aria-label="Latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    placeholder="Latitude"
                  />
                  <input
                    aria-label="Longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    placeholder="Longitude"
                  />
                </div>
                {latitude && longitude ? (
                  <small>
                    <Ic.MapPin size={13} /> {latitude}, {longitude}
                  </small>
                ) : null}
                {locationError ? (
                  <small className="merchant-onboarding-location-error">
                    {locationError}
                  </small>
                ) : null}
              </div>
              <details
                className="merchant-onboarding-hours"
                onToggle={(event) => setHoursEnabled(event.currentTarget.open)}
              >
                <summary>
                  Hours <span>optional · Asia/Kolkata</span>
                </summary>
                <div className="merchant-onboarding-hours-fields">
                  <Field label="Opens" htmlFor="onboarding-open-time">
                    <input
                      id="onboarding-open-time"
                      type="time"
                      value={openTime}
                      onChange={(event) => setOpenTime(event.target.value)}
                    />
                  </Field>
                  <Field label="Closes" htmlFor="onboarding-close-time">
                    <input
                      id="onboarding-close-time"
                      type="time"
                      value={closeTime}
                      onChange={(event) => setCloseTime(event.target.value)}
                    />
                  </Field>
                </div>
              </details>
              <p className="merchant-onboarding-note">
                Create the outlet, then open Queue. Adding services is optional
                and happens afterward.
              </p>
              <button
                className="merchant-button merchant-onboarding-submit"
                type="submit"
                disabled={saving !== null}
              >
                {saving === "outlet" ? "Creating…" : "Create outlet →"}
              </button>
            </form>
          ) : (
            <div className="merchant-onboarding-locked">
              <span className="merchant-onboarding-lock">2</span>
              <p>
                Save your business first. Then add the location where your team
                will receive requests.
              </p>
            </div>
          )}
        </section>
      </div>
      <footer className="merchant-onboarding-footer">
        Consumer details such as name, phone and area can be completed later in
        Account. Public discovery never depends on profile completeness.
      </footer>
    </main>
  );
}

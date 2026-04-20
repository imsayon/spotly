'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Grocery',
  'Pharmacy',
  'Food & Beverage',
  'Retail',
  'Salon & Spa',
  'Other',
] as const;

type CategoryType = (typeof CATEGORIES)[number];

const SUGGESTED_ITEMS: Record<CategoryType, string[]> = {
  Grocery: ['Rice', 'Wheat Flour', 'Sugar', 'Salt', 'Cooking Oil', 'Milk', 'Eggs', 'Bread', 'Pulses', 'Tea/Coffee'],
  Pharmacy: ['Paracetamol', 'Antacids', 'Bandages', 'BP Monitor', 'Thermometer', 'Vitamins', 'Cough Syrup'],
  'Food & Beverage': ['Burger', 'Sandwich', 'Juice', 'Coffee', 'Tea', 'Snacks', 'Meals'],
  'Salon & Spa': ['Haircut', 'Shave', 'Facial', 'Hair Colour', 'Manicure', 'Pedicure'],
  Retail: ['Clothing', 'Footwear', 'Accessories', 'Electronics', 'Stationery'],
  Other: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Business', 'Inventory', 'Outlet', 'Done'];

const MERCHANT_GREEN = 'linear-gradient(135deg,#1fd97c,#059669)';
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 14,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color .2s',
  fontFamily: 'var(--font-sans)',
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(255,255,255,.45)',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { merchantProfile, setMerchantProfile } = useAuthStore();

  // If already has a profile, skip onboarding
  if (merchantProfile) {
    router.replace('/dashboard');
    return null;
  }

  return <OnboardingFlow />;
}

function OnboardingFlow() {
  const router = useRouter();
  const { setMerchantProfile } = useAuthStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Business Profile
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<CategoryType | ''>('');
  const [phone, setPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  // Step 2 — Inventory
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customItem, setCustomItem] = useState('');
  const [allItems, setAllItems] = useState<string[]>([]);

  // Step 3 — Outlet
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');

  // ── Location capture ──────────────────────────────────────────────────

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      return;
    }
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setLocError('Could not get location. Please enter coordinates manually.');
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // ── Inventory helpers ─────────────────────────────────────────────────

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const addCustomItem = () => {
    const trimmed = customItem.trim();
    if (!trimmed) return;
    setAllItems((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSelectedItems((prev) => new Set([...prev, trimmed]));
    setCustomItem('');
  };

  // ── Step navigation ───────────────────────────────────────────────────

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!businessName.trim()) return setError('Business name is required');
      if (!category) return setError('Please select a category');
      if (!phone.trim()) return setError('Phone number is required');
      if (!businessAddress.trim()) return setError('Business address is required');
      if (!location) return setError('Store location is required — tap "Get My Location" or enter coordinates');

      // Pre-fill outlet defaults
      if (!outletName) setOutletName(businessName);
      if (!outletAddress) setOutletAddress(businessAddress);

      // Populate suggested items for inventory step
      if (category !== 'Other') {
        setAllItems(SUGGESTED_ITEMS[category as CategoryType] || []);
      }
    }

    if (step === 3) {
      if (!outletName.trim()) return setError('Outlet name is required');
      if (!outletAddress.trim()) return setError('Outlet address is required');
    }

    setStep((s) => s + 1);
  };

  // ── Final submit ──────────────────────────────────────────────────────

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Create or retrieve merchant with ALL fields in one shot
      const merchantRes = await api.post('/merchant', {
        name: businessName,
        category,
        phone,
        address: businessAddress,
        lat: location?.lat,
        lng: location?.lng,
      });

      if (!merchantRes.data.success) {
        throw new Error(merchantRes.data.message || 'Failed to create merchant');
      }

      const merchant = merchantRes.data.data;

      // 2. Persist inventory to localStorage for the Inventory page
      const inventoryItems = Array.from(selectedItems);
      localStorage.setItem(
        `spotly_inventory_${merchant.id}`,
        JSON.stringify(inventoryItems.map((name) => ({ name, available: true })))
      );

      // 3. Create outlet with location + hours
      try {
        await api.post('/outlet', {
          name: outletName,
          address: outletAddress,
          lat: location?.lat,
          lng: location?.lng,
          openTime,
          closeTime,
        });
      } catch (outletErr: any) {
        // Outlet creation failure is non-fatal — merchant is created, redirect anyway
        console.warn('[Onboarding] Outlet creation failed (non-fatal):', outletErr?.message);
      }

      // 4. Update auth store so RouteGuard won't redirect back to onboarding
      setMerchantProfile(merchant);

      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Setup failed. Please try again.';
      console.error('[Onboarding] Completion failed:', err);
      setError(msg);
      setIsLoading(false);
    }
  };

  // ── Animation variants ────────────────────────────────────────────────

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  // ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#040407',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px 80px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: MERCHANT_GREEN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>spotly.</div>
          <div style={{ fontSize: 9, color: '#1fd97c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>
            Business
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, gap: 0 }}>
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: done
                        ? MERCHANT_GREEN
                        : active
                        ? 'rgba(31,217,124,.15)'
                        : 'rgba(255,255,255,.06)',
                      border: active
                        ? '2px solid #1fd97c'
                        : done
                        ? 'none'
                        : '2px solid rgba(255,255,255,.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      color: done ? '#fff' : active ? '#1fd97c' : 'rgba(255,255,255,.25)',
                      transition: 'all .3s',
                    }}
                  >
                    {done ? '✓' : stepNum}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: active ? '#1fd97c' : done ? '#fff' : 'rgba(255,255,255,.2)',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </div>
                </div>
                {i < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      marginBottom: 18,
                      background: done
                        ? '#1fd97c'
                        : 'rgba(255,255,255,.07)',
                      transition: 'background .4s',
                      margin: '0 8px 18px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 24,
            padding: 32,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,.4)',
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                background: 'rgba(255,77,109,.1)',
                border: '1px solid rgba(255,77,109,.25)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                color: '#ff6b88',
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ═══ STEP 1 — Business Profile ═══ */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    Let's set up your business
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
                    Tell us about your store.
                  </p>
                </div>

                <Field label="Business Name *">
                  <input
                    style={INPUT_STYLE}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Joe's Coffee"
                  />
                </Field>

                <Field label="Category *">
                  <select
                    style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} style={{ background: '#0f0f14' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Phone *">
                  <input
                    style={INPUT_STYLE}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </Field>

                <Field label="Business Address *">
                  <textarea
                    style={{ ...INPUT_STYLE, resize: 'none', height: 80 }}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="123 Main Street, City"
                  />
                </Field>

                <Field label="Store Location *">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {location ? (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: 14,
                          background: 'rgba(31,217,124,.07)',
                          border: '1px solid rgba(31,217,124,.2)',
                          fontSize: 13,
                          color: '#1fd97c',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                        <button
                          onClick={() => setLocation(null)}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(31,217,124,.6)',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={captureLocation}
                          disabled={locLoading}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            background: locLoading
                              ? 'rgba(255,255,255,.04)'
                              : 'rgba(31,217,124,.08)',
                            border: '1px solid rgba(31,217,124,.2)',
                            color: locLoading ? 'rgba(255,255,255,.3)' : '#1fd97c',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: locLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all .2s',
                          }}
                        >
                          {locLoading ? (
                            <>
                              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                              Detecting location...
                            </>
                          ) : (
                            <>📍 Get My Location</>
                          )}
                        </button>
                        {locError && (
                          <p style={{ fontSize: 12, color: '#ff6b88', margin: 0 }}>{locError}</p>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input
                            style={{ ...INPUT_STYLE, flex: 1 }}
                            placeholder="Latitude (e.g. 12.9716)"
                            type="number"
                            step="any"
                            onChange={(e) => {
                              const lat = parseFloat(e.target.value);
                              if (!isNaN(lat)) setLocation((prev) => ({ lat, lng: prev?.lng ?? 0 }));
                            }}
                          />
                          <input
                            style={{ ...INPUT_STYLE, flex: 1 }}
                            placeholder="Longitude (e.g. 77.5946)"
                            type="number"
                            step="any"
                            onChange={(e) => {
                              const lng = parseFloat(e.target.value);
                              if (!isNaN(lng)) setLocation((prev) => ({ lat: prev?.lat ?? 0, lng }));
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Field>

                <StepNav onNext={handleNext} />
              </motion.div>
            )}

            {/* ═══ STEP 2 — Inventory ═══ */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    Inventory Quick Setup
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
                    Tap items to mark as available. Add custom items below. You can change this later.
                  </p>
                </div>

                {category && category !== 'Other' && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.3)',
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      Suggested for {category}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SUGGESTED_ITEMS[category as CategoryType].map((item) => {
                        const on = selectedItems.has(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleItem(item)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 99,
                              border: on
                                ? '1px solid rgba(31,217,124,.4)'
                                : '1px solid rgba(255,255,255,.1)',
                              background: on
                                ? 'rgba(31,217,124,.12)'
                                : 'rgba(255,255,255,.04)',
                              color: on ? '#1fd97c' : 'rgba(255,255,255,.5)',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all .18s',
                            }}
                          >
                            {on ? '✓ ' : ''}{item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom items added via text */}
                {allItems.filter((i) => !SUGGESTED_ITEMS[category as CategoryType]?.includes(i)).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                      Custom Items
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {allItems
                        .filter((i) => !SUGGESTED_ITEMS[category as CategoryType]?.includes(i))
                        .map((item) => {
                          const on = selectedItems.has(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleItem(item)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 99,
                                border: on ? '1px solid rgba(31,217,124,.4)' : '1px solid rgba(255,255,255,.1)',
                                background: on ? 'rgba(31,217,124,.12)' : 'rgba(255,255,255,.04)',
                                color: on ? '#1fd97c' : 'rgba(255,255,255,.5)',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all .18s',
                              }}
                            >
                              {on ? '✓ ' : ''}{item}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Add custom item */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...INPUT_STYLE, flex: 1 }}
                    value={customItem}
                    onChange={(e) => setCustomItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                    placeholder="Add custom item, press Enter"
                  />
                  <button
                    type="button"
                    onClick={addCustomItem}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.12)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>

                {selectedItems.size > 0 && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: 'rgba(31,217,124,.05)',
                      border: '1px solid rgba(31,217,124,.1)',
                      fontSize: 13,
                      color: 'rgba(255,255,255,.5)',
                    }}
                  >
                    <span style={{ color: '#1fd97c', fontWeight: 700 }}>{selectedItems.size} items</span> selected
                  </div>
                )}

                <StepNav onBack={() => setStep((s) => s - 1)} onNext={handleNext} />
              </motion.div>
            )}

            {/* ═══ STEP 3 — Outlet Details ═══ */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    Outlet Details
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
                    Configure your first location.
                  </p>
                </div>

                <Field label="Outlet Name *">
                  <input
                    style={INPUT_STYLE}
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    placeholder="e.g. Main Branch"
                  />
                </Field>

                <Field label="Full Address *">
                  <textarea
                    style={{ ...INPUT_STYLE, resize: 'none', height: 80 }}
                    value={outletAddress}
                    onChange={(e) => setOutletAddress(e.target.value)}
                    placeholder="123 Main Street, City"
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Opening Time">
                    <input
                      style={INPUT_STYLE}
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </Field>
                  <Field label="Closing Time">
                    <input
                      style={INPUT_STYLE}
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </Field>
                </div>

                <StepNav onBack={() => setStep((s) => s - 1)} onNext={handleNext} nextLabel="Review →" />
              </motion.div>
            )}

            {/* ═══ STEP 4 — Summary / Done ═══ */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      background: 'rgba(31,217,124,.1)',
                      border: '1px solid rgba(31,217,124,.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      margin: '0 auto 16px',
                    }}
                  >
                    🏪
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    You're almost ready!
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
                    Review your details before launch.
                  </p>
                </div>

                {/* Summary card */}
                <div
                  style={{
                    background: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.09)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    fontSize: 14,
                  }}
                >
                  {[
                    { label: 'Business', value: businessName },
                    { label: 'Category', value: category },
                    { label: 'Phone', value: phone },
                    { label: 'Address', value: businessAddress },
                    {
                      label: 'Location',
                      value: location
                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : '—',
                    },
                    { label: 'Outlet', value: outletName },
                    { label: 'Hours', value: `${openTime} – ${closeTime}` },
                    {
                      label: 'Inventory',
                      value: `${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''} selected`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 12 }}>
                      <span
                        style={{
                          minWidth: 90,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,.3)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          paddingTop: 1,
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ color: '#fff', fontWeight: 600, wordBreak: 'break-word' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(255,255,255,.1)',
                      color: 'rgba(255,255,255,.5)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isLoading}
                    style={{
                      flex: 2,
                      padding: '14px',
                      borderRadius: 14,
                      background: isLoading ? 'rgba(31,217,124,.3)' : MERCHANT_GREEN,
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                        Launching...
                      </>
                    ) : (
                      'Go to Dashboard 🚀'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
        select option { background: #0f0f14; color: #fff; }
      `}</style>
    </div>
  );
}

// ─── Helper: Step Navigation Buttons ─────────────────────────────────────────

function StepNav({
  onBack,
  onNext,
  nextLabel = 'Next →',
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '13px 24px',
            borderRadius: 14,
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.1)',
            color: 'rgba(255,255,255,.5)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          style={{
            flex: 1,
            padding: '13px 24px',
            borderRadius: 14,
            background: 'linear-gradient(135deg,#1fd97c,#059669)',
            border: 'none',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

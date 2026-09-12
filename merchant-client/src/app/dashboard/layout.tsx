"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark, Ic, ToastContainer, useToasts } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";

const nav = [
  { href: "/dashboard", label: "Queue", icon: Ic.Users },
  { href: "/dashboard/outlets", label: "Outlets", icon: Ic.Store },
  { href: "/dashboard/inventory", label: "Services", icon: Ic.Tag },
  { href: "/dashboard/analytics", label: "Activity", icon: Ic.Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Ic.Settings },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    merchantProfile,
    loading: authLoading,
    identityError,
    setUser,
    signOut,
  } = useAuthStore();
  const store = useQueueStore();
  const { toasts, add } = useToasts();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (menuOpen) menu.current?.showModal();
    else menu.current?.close();
  }, [menuOpen]);

  useEffect(() => {
    store.setToastFn(add);
    if (authLoading || !merchantProfile?.id) return;
    void store.fetchOutlets(merchantProfile.id);
    return () => store.disconnectRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, merchantProfile?.id, add]);

  useEffect(() => {
    if (authLoading || identityError) return;
    if (!user) router.replace("/");
    else if (!merchantProfile) router.replace("/onboarding");
  }, [authLoading, identityError, merchantProfile, router, user]);

  if (authLoading)
    return (
      <div className="merchant-empty" style={{ minHeight: "100vh" }}>
        Loading your workspace…
      </div>
    );
  if (!user)
    return (
      <div className="merchant-empty" style={{ minHeight: "100vh" }}>
        Returning to sign in…
      </div>
    );
  if (identityError)
    return (
      <div
        className="merchant-empty"
        style={{ minHeight: "100vh", padding: 24 }}
      >
        <div className="merchant-card" style={{ maxWidth: 480, padding: 24 }}>
          <h1>Workspace unavailable</h1>
          <p>{identityError}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              className="merchant-button"
              onClick={() => void setUser(user).catch(() => undefined)}
            >
              Retry
            </button>
            <button
              className="merchant-button secondary"
              onClick={() => void signOut().catch(() => undefined)}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  if (!merchantProfile)
    return (
      <div className="merchant-empty" style={{ minHeight: "100vh" }}>
        Preparing your workspace…
      </div>
    );

  const current = store.outlets.find(
    (outlet) => outlet.id === store.selectedOutletId,
  );
  const active = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    add("Signing out…", "info");
    try {
      await signOut();
    } catch {
      add("Sign out failed. Please try again.", "error");
    }
  };

  return (
    <div className="merchant-redesign-shell">
      <aside className="merchant-redesign-sidebar">
        <Link href="/dashboard" className="merchant-redesign-brand">
          <span className="merchant-redesign-mark">
            <BrandMark />
          </span>
          <span>
            <strong>spotly.</strong>
            <small>merchant workspace</small>
          </span>
        </Link>
        <nav className="merchant-redesign-nav" aria-label="Merchant navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={active(href) ? "is-active" : ""}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="merchant-redesign-profile">
          <div className="merchant-redesign-profile-row">
            <span className="merchant-redesign-avatar">
              {merchantProfile.name?.[0]?.toUpperCase() || "M"}
            </span>
            <span>
              <strong>{merchantProfile.name}</strong>
              <small>{current?.name || "Select an outlet"}</small>
            </span>
          </div>
          <button className="merchant-redesign-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="merchant-redesign-main">
        <header className="merchant-redesign-mobile-header">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              fontWeight: 600,
            }}
          >
            <span className="merchant-redesign-mark">
              <BrandMark />
            </span>
            spotly.
          </span>
          <button
            aria-expanded={menuOpen}
            aria-label="Open navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Ic.Menu size={18} /> Menu
          </button>
        </header>
        <dialog
          ref={menu}
          className="merchant-navigation-dialog"
          aria-label="Merchant navigation"
          onClose={() => setMenuOpen(false)}
        >
          <div className="merchant-panel-heading">
            <strong>Workspace menu</strong>
            <button
              className="merchant-button secondary"
              onClick={() => setMenuOpen(false)}
              autoFocus
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <button className="merchant-button secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </dialog>
        <main className="merchant-redesign-content">
          {children}
          <footer className="workspace-footer">
            <div>
              <span className="workspace-footer-kicker">
                Good days happen locally
              </span>
              <p>
                A little less waiting.
                <br />A little more day.
              </p>
            </div>
          </footer>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

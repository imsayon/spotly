"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark, Ic, ToastContainer, useToasts } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";

const nav = [
  { href: "/home", label: "Discover", icon: Ic.Search },
  { href: "/home/queue", label: "Your turn", icon: Ic.Clock },
  { href: "/home/favorites", label: "Saved", icon: Ic.Heart },
  { href: "/home/profile", label: "Account", icon: Ic.User },
];

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, identityError, signOut } = useAuthStore();
  const { toasts, add } = useToasts();
  const myEntry = useQueueStore((state) => state.myEntry);
  const fetchActiveEntry = useQueueStore((state) => state.fetchActiveEntry);
  const clearActive = useQueueStore((state) => state.clearActive);

  useEffect(() => {
    if (user) void fetchActiveEntry();
    else clearActive();
  }, [clearActive, fetchActiveEntry, user]);

  const firstName =
    profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  const handleSignOut = async () => {
    add("Signing out…", "info");
    try {
      await signOut();
    } catch {
      add("Sign out failed. Please try again.", "error");
    }
  };

  return (
    <div className="consumer-redesign-shell">
      <header className="consumer-redesign-header">
        <Link
          className="consumer-redesign-brand"
          href="/"
          aria-label="Spotly home"
        >
          <span className="consumer-redesign-mark">
            <BrandMark />
          </span>
          <span>spotly.</span>
        </Link>
        <nav className="consumer-redesign-nav" aria-label="Consumer navigation">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={isActive(href) ? "is-active" : ""}
              href={href}
            >
              {label}
              {href === "/home/queue" && myEntry ? (
                <span
                  aria-label="Active queue"
                  style={{ marginLeft: 6, color: "var(--success)" }}
                >
                  ●
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="consumer-redesign-actions">
          <span className="consumer-kicker" aria-live="polite">
            {firstName}
          </span>
          <button
            className="consumer-redesign-account"
            onClick={() => router.push("/home/profile")}
            aria-label="Open account"
          >
            {firstName[0]?.toUpperCase()}
          </button>
          {user ? (
            <button className="consumer-button quiet" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link className="consumer-button quiet" href="/auth/sign-in">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="consumer-redesign-content">
        {identityError ? (
          <div role="alert" className="consumer-inline-error">
            {identityError}{" "}
            <button
              className="consumer-button quiet"
              onClick={() => window.location.reload()}
            >
              Retry account
            </button>
          </div>
        ) : null}
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
      <nav
        className="consumer-redesign-mobile-nav"
        aria-label="Mobile navigation"
      >
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={isActive(href) ? "is-active" : ""}
            href={href}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

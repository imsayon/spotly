"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useQueueStore } from "@/store/queue.store";
import { useToasts } from "@spotly/ui";

export default function SettingsPage() {
  const { user, signOut } = useAuthStore();
  const { outlets, selectedOutletId } = useQueueStore();
  const { add } = useToasts();
  const outlet =
    outlets.find((item) => item.id === selectedOutletId) || outlets[0];
  const items = [
    {
      href: "/dashboard/business",
      label: "Business details",
      copy: "Name, contact and public profile information.",
    },
    {
      href: outlet
        ? `/dashboard/outlets/detail?id=${encodeURIComponent(outlet.id)}#sharing`
        : "/dashboard/outlets",
      label: "Sharing",
      copy: outlet
        ? `Share ${outlet.name} with your customers.`
        : "Choose an outlet to create a share link.",
    },
    {
      href: outlet
        ? `/dashboard/settings/reviews?outletId=${encodeURIComponent(outlet.id)}`
        : "/dashboard/settings/reviews",
      label: "Reviews",
      copy: "Read the feedback attached to an outlet.",
    },
  ];
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (cause: any) {
      add(cause?.message || "Sign out could not be completed", "error");
    }
  };
  return (
    <div
      className="merchant-page-heading"
      style={{ display: "block", maxWidth: 820, margin: "0 auto" }}
    >
      <header className="merchant-page-heading">
        <div>
          <div className="merchant-kicker">Settings</div>
          <h1>Keep the workspace in order.</h1>
          <p>Business details, sharing and account access live here.</p>
        </div>
      </header>
      <section
        className="merchant-card merchant-settings-list"
        aria-label="Settings links"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="merchant-settings-row"
          >
            <span>
              <strong>{item.label}</strong>
              <small>{item.copy}</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
      <section className="merchant-card merchant-settings-account">
        <div>
          <div className="merchant-kicker">Account</div>
          <h2>{user?.email || "Signed-in account"}</h2>
          <p>Email is the identity used for this workspace.</p>
        </div>
        <div className="merchant-settings-actions">
          <Link
            className="merchant-button secondary"
            href="/auth/reset?returnTo=%2Fdashboard%2Fsettings"
          >
            Reset password
          </Link>
          <Link
            className="merchant-button quiet"
            href="/dashboard/settings/security"
          >
            Security &amp; login
          </Link>
          <button className="merchant-button quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

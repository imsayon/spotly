"use client";


import { Ic } from "@spotly/ui";
import { useRouter } from "next/navigation";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="merchant-settings-unavailable">
      <button className="merchant-button quiet" onClick={() => router.back()}>
        <Ic.ChevL size={16} /> Back
      </button>
      <div className="merchant-card merchant-settings-account">
        <div className="merchant-kicker">Settings</div>
        <h1>{title}</h1>
        <p>{description}</p>
        <p className="merchant-settings-note">
          This feature is not available yet.
        </p>
        <button
          className="merchant-button secondary"
          onClick={() => router.push("/dashboard/settings")}
        >
          Back to settings
        </button>
      </div>
    </div>
  );
}

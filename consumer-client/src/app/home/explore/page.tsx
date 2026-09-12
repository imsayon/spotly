"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConsumerExploreAlias() {
  const router = useRouter();
  const [destination, setDestination] = useState("/home?view=map");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "map");
    const next = `/home?${params.toString()}`;
    setDestination(next);
    router.replace(next);
  }, [router]);

  return (
    <div className="consumer-page">
      <div className="consumer-empty-state">
        <p>Opening map view…</p>
        <Link className="consumer-button" href={destination}>
          Open map view
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { animate, Ic, motionEnabled } from "@spotly/ui";
import api from "@/lib/api";

type VerifiedTicket = {
  verified: boolean;
  entryId: string;
  outletId: string;
  tokenNumber: number;
  verifiedAt: string;
};

export default function VerificationScanner({
  onVerified,
  outletId,
  disabled = false,
}: {
  onVerified: (ticket: VerifiedTicket) => void;
  outletId: string;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const redeeming = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const stop = () => {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setScanning(false);
  };

  const redeem = async (rawToken: string) => {
    const token = rawToken.trim();
    if (redeeming.current) return;
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) {
      setError("That QR code is not a Spotly customer ticket.");
      return;
    }
    redeeming.current = true;
    stop();
    setError("");
    setNotice("");
    try {
      const response = await api.post("/queue/verification/redeem", { token, outletId });
      const ticket = response.data.data as VerifiedTicket;
      setNotice(`Token ${String(ticket.tokenNumber).padStart(3, "0")} verified.`);
      setManualToken("");
      onVerified(ticket);
    } catch (cause: any) {
      setError(cause?.message || "This customer QR is expired or already used.");
    } finally {
      redeeming.current = false;
    }
  };

  const start = async () => {
    if (disabled || scanning || !videoRef.current) return;
    setError("");
    setNotice("");
    try {
      const { default: QrScanner } = await import("qr-scanner");
      const video = videoRef.current;
      const scanner = new QrScanner(
        video,
        (result) => {
          const token = typeof result === "string" ? result : result.data;
          void redeem(token);
        },
        { returnDetailedScanResult: true },
      );
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start();
    } catch {
      if (!scannerRef.current) return;
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setScanning(false);
      setError("Camera access is unavailable. Paste the customer's token below.");
    }
  };

  useEffect(() => stop, []);
  useEffect(() => {
    const panel = verificationRef.current;
    if (!panel || !notice || !motionEnabled()) return;
    const animation = animate(panel, {
      scale: [0.98, 1],
      opacity: [0.7, 1],
      duration: 420,
      ease: "out(4)",
    });
    return () => {
      animation.revert();
    };
  }, [notice]);

  return (
    <div ref={verificationRef} className="merchant-verification" aria-label="Verify customer ticket">
      <div className="merchant-panel-heading">
        <div>
          <div className="merchant-kicker">Customer verification</div>
          <h3>Scan the ticket before serving</h3>
          <p>QR codes expire quickly and can only be used once.</p>
        </div>
        <Ic.Shield size={22} />
      </div>
      <video
        ref={videoRef}
        className={`merchant-verification-video ${scanning ? "" : "is-idle"}`}
        muted
        playsInline
      />
      {error ? <p className="merchant-verification-error" role="alert">{error}</p> : null}
      {notice ? <p className="merchant-verification-success" role="status">{notice}</p> : null}
      <div className="merchant-verification-actions">
        <button className="merchant-button secondary" type="button" onClick={scanning ? stop : start} disabled={disabled}>
          <Ic.Smartphone size={15} /> {scanning ? "Stop camera" : "Scan QR"}
        </button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void redeem(manualToken);
          }}
          className="merchant-verification-manual"
        >
          <label className="sr-only" htmlFor="verification-token">Customer token</label>
          <input id="verification-token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Paste token" autoComplete="off" />
          <button className="merchant-button quiet" type="submit" disabled={disabled || !manualToken.trim()}>Verify</button>
        </form>
      </div>
    </div>
  );
}

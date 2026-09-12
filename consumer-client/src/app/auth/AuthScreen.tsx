"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, Ic } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up" | "reset" | "update" | "verify" | "callback";

function safeReturn(value: string | null) {
  try {
    const url = new URL(value || "/home", "https://spotly.invalid");
    if (
      url.origin !== "https://spotly.invalid" ||
      ![
        "/home",
        "/home/explore",
        "/home/favorites",
        "/home/profile",
        "/home/queue",
        "/merchant",
        "/queue",
      ].includes(url.pathname)
    )
      return "/home";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/home";
  }
}

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [returnTo, setReturnTo] = useState("/home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = safeReturn(
      params.get("returnTo") || sessionStorage.getItem("spotly-return-to"),
    );
    setReturnTo(target);
    if (params.get("email")) setEmail(params.get("email") || "");
    if (params.get("returnTo"))
      sessionStorage.setItem("spotly-return-to", target);
  }, []);

  useEffect(() => {
    if (mode !== "callback") return;
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError || !session) {
          setError("This sign-in link is no longer valid. Start again.");
          return;
        }
        if (
          new URLSearchParams(window.location.hash.slice(1)).get("type") ===
          "recovery"
        ) {
          router.replace("/auth/update-password");
          return;
        }
        const target = safeReturn(
          new URLSearchParams(window.location.search).get("returnTo") ||
            sessionStorage.getItem("spotly-return-to"),
        );
        sessionStorage.removeItem("spotly-return-to");
        router.replace(target);
      });
    return () => {
      mounted = false;
    };
  }, [mode, router]);

  const copy = useMemo(
    () =>
      ({
        "sign-in": ["Welcome back", "Sign in to keep a queue request moving."],
        "sign-up": [
          "Make room in your day",
          "Create a Spotly account to request a place.",
        ],
        reset: [
          "Reset your password",
          "We will send a link if the address can receive one.",
        ],
        update: [
          "Choose a new password",
          "Your recovery session is limited to this update.",
        ],
        verify: [
          "Check your email",
          "Confirm your address before returning to Spotly.",
        ],
        callback: [
          "Finishing sign-in",
          "One moment while we return you to Spotly.",
        ],
      }) as Record<Mode, [string, string]>,
    [mode],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "sign-in") {
        await signInWithEmail(email.trim(), password);
        sessionStorage.removeItem("spotly-return-to");
        router.replace(returnTo);
      } else if (mode === "sign-up") {
        const session = await signUpWithEmail(
          email.trim(),
          password,
          name.trim() || undefined,
        );
        if (session) router.replace(returnTo);
        else {
          sessionStorage.setItem("spotly-verify-email", email.trim());
          router.replace(
            `/auth/verify?email=${encodeURIComponent(email.trim())}`,
          );
        }
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/update-password?returnTo=${encodeURIComponent(returnTo)}`,
          },
        );
        if (resetError) throw resetError;
        setNotice("If that address is registered, a reset link is on its way.");
      } else if (mode === "update") {
        if (password.length < 8 || password !== confirmation)
          throw new Error(
            "Use at least 8 characters and make both passwords match.",
          );
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session)
          throw new Error(
            "Your recovery link has expired. Request a new password reset.",
          );
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        router.replace(returnTo);
      } else if (mode === "verify") {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
          },
        });
        if (resendError) throw resendError;
        setNotice("A new confirmation request was sent.");
      }
    } catch (cause: any) {
      setError(cause?.message || "That action could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError("");
    sessionStorage.setItem("spotly-return-to", returnTo);
    try {
      await signInWithGoogle();
    } catch (cause: any) {
      setError(cause?.message || "Google sign-in could not start.");
      setBusy(false);
    }
  };
  if (mode === "callback")
    return (
      <AuthFrame title={copy[mode][0]} subtitle={copy[mode][1]}>
        <div className="auth-page-status" role={error ? "alert" : "status"}>
          {error || "Checking your session…"}
        </div>
        {error ? (
          <Link className="auth-page-link" href="/auth/sign-in">
            Start sign-in again
          </Link>
        ) : null}
      </AuthFrame>
    );
  if (mode === "verify")
    return (
      <AuthFrame title={copy[mode][0]} subtitle={copy[mode][1]}>
        <form onSubmit={submit} className="auth-page-form">
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {error ? (
            <div role="alert" className="auth-page-error">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div role="status" className="auth-page-notice">
              {notice}
            </div>
          ) : null}
          <button className="consumer-button" disabled={busy}>
            {busy ? "Sending…" : "Resend confirmation"}
          </button>
          <Link className="auth-page-link" href="/auth/sign-in">
            Back to sign in
          </Link>
        </form>
      </AuthFrame>
    );
  return (
    <AuthFrame title={copy[mode][0]} subtitle={copy[mode][1]}>
      <div className="auth-page-form">
        {mode !== "reset" && mode !== "update" ? (
          <button
            className="consumer-button secondary"
            onClick={google}
            disabled={busy}
          >
            <Ic.Google size={17} /> Continue with Google
          </button>
        ) : null}
        {mode !== "reset" && mode !== "update" ? (
          <div className="auth-page-divider">or email</div>
        ) : null}
        <form onSubmit={submit} className="auth-page-form">
          {mode === "sign-up" ? (
            <label>
              Name (optional)
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          ) : null}
          {mode !== "update" ? (
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          ) : null}
          {mode === "update" ? (
            <>
              <label>
                New password
                <input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label>
                Confirm password
                <input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
            </>
          ) : mode !== "reset" ? (
            <label>
              Password
              <input
                required
                minLength={mode === "sign-up" ? 8 : undefined}
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          ) : null}
          {mode === "sign-in" || mode === "update" ? (
            <button
              type="button"
              className="auth-page-link auth-page-show"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          ) : null}
          {error ? (
            <div role="alert" className="auth-page-error">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div role="status" className="auth-page-notice">
              {notice}
            </div>
          ) : null}
          <button className="consumer-button" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : mode === "sign-up"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Update password"}
          </button>
        </form>
        {mode === "sign-in" ? (
          <>
            <Link
              className="auth-page-link"
              href={`/auth/reset?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Forgot password?
            </Link>
            <Link
              className="auth-page-link"
              href={`/auth/sign-up?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Create an account
            </Link>
          </>
        ) : null}
        {mode === "sign-up" ? (
          <Link
            className="auth-page-link"
            href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Already have an account? Sign in
          </Link>
        ) : null}
        {mode === "reset" ? (
          <Link className="auth-page-link" href="/auth/sign-in">
            Back to sign in
          </Link>
        ) : null}
      </div>
    </AuthFrame>
  );
}

function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-page-brand">
        <span className="consumer-redesign-mark">
          <BrandMark />
        </span>
        <span>spotly.</span>
      </div>
      <section className="consumer-card auth-page-card">
        <div className="consumer-kicker">Consumer account</div>
        <h1 className="consumer-editorial">{title}</h1>
        <p>{subtitle}</p>
        {children}
      </section>
      <Link className="auth-page-back" href="/">
        Return to Spotly
      </Link>
    </main>
  );
}

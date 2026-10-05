import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import {
  Button,
  Card,
  colors,
  errorMessage,
  Field,
  Notice,
  PageFrame,
  pageTitle,
} from "../ui";
import { safeReturnTo } from "./returnTo";

export type AuthMode = "sign-in" | "sign-up" | "recover" | "update-password";

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[]; email?: string | string[] }>();
  const { user, loading, identityError, signInWithEmail, signUpWithEmail, resendSignupConfirmation, requestPasswordReset, signInWithGoogle, updatePassword } = useAuth();
  const returnTo = safeReturnTo(Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo);
  const [email, setEmail] = useState(Array.isArray(params.email) ? params.email[0] || "" : params.email || "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user && !identityError && mode !== "update-password") router.replace(returnTo);
  }, [identityError, loading, mode, returnTo, router, user]);

  const submit = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "sign-in") {
        await signInWithEmail(email.trim(), password);
      } else if (mode === "sign-up") {
        const result = await signUpWithEmail(email.trim(), password, name.trim() || undefined);
        if (result.requiresEmailConfirmation) {
          setConfirmationPending(true);
          setNotice("Check your inbox for a confirmation link. You can sign in here after confirming your email.");
        }
      } else if (mode === "recover") {
        await requestPasswordReset(email.trim());
        setNotice("If that address is registered, a password reset link is on its way.");
      } else {
        if (password.length < 8 || password !== confirmation) {
          throw new Error("Use at least 8 characters and make both passwords match.");
        }
        await updatePassword(password);
        setNotice("Password updated.");
        router.replace(returnTo);
      }
    } catch (cause) {
      setError(errorMessage(cause, "That action could not be completed. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    setBusy(true);
    setError("");
    try {
      await resendSignupConfirmation(email.trim());
      setNotice("A new confirmation link was sent if this address can receive one.");
    } catch (cause) {
      setError(errorMessage(cause, "The confirmation link could not be sent. Try again shortly."));
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const signedIn = await signInWithGoogle();
      if (!signedIn) setNotice("Google sign-in was cancelled. You can continue with email instead.");
    } catch (cause) {
      setError(errorMessage(cause, "Google sign-in could not start. Try email sign-in instead."));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "sign-in" ? "Welcome back" : mode === "sign-up" ? "Create your account" : mode === "recover" ? "Reset your password" : "Choose a new password";
  const subtitle = mode === "sign-in"
    ? "Sign in to keep your queue request moving."
    : mode === "sign-up"
      ? "Create a Spotly account to request a place."
      : mode === "recover"
        ? "We’ll send a reset link if the address can receive one."
        : "Your recovery link is limited to this password update.";

  return (
    <PageFrame showNav={false}>
      {pageTitle(title, subtitle)}
      <Card style={styles.authCard}>
        {mode === "sign-in" || mode === "sign-up" ? (
          <>
            <Button label="Continue with Google" tone="secondary" onPress={() => void continueWithGoogle()} loading={busy} />
            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR USE EMAIL</Text><View style={styles.dividerLine} /></View>
          </>
        ) : null}
        {mode === "sign-up" ? (
          <Field label="Name (optional)" value={name} onChangeText={setName} autoComplete="name" textContentType="name" returnKeyType="next" />
        ) : null}
        {mode !== "update-password" ? (
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType={mode === "recover" ? "done" : "next"}
          />
        ) : null}
        {mode === "sign-in" || mode === "sign-up" ? (
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            textContentType={mode === "sign-up" ? "newPassword" : "password"}
            hint={mode === "sign-up" ? "Use at least 8 characters." : undefined}
            returnKeyType="done"
          />
        ) : null}
        {mode === "update-password" ? (
          <>
            <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" hint="Use at least 8 characters." />
            <Field label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType="done" />
          </>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {identityError && user ? <Notice tone="error">{identityError}</Notice> : null}
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        {mode === "sign-up" && confirmationPending ? (
          <Pressable onPress={() => void resendConfirmation()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{busy ? "Sending…" : "Resend confirmation link"}</Text>
          </Pressable>
        ) : null}
        {mode === "sign-in" ? (
          <Pressable onPress={() => router.push({ pathname: "/recover", params: { returnTo, email } })} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        ) : null}
        <Button
          label={mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "recover" ? "Send reset link" : "Update password"}
          onPress={() => void submit()}
          loading={busy}
        />
        {mode === "sign-in" ? (
          <Pressable onPress={() => router.push({ pathname: "/sign-up", params: { returnTo } })} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>New to Spotly? Create an account</Text>
          </Pressable>
        ) : mode === "sign-up" || mode === "recover" || mode === "update-password" ? (
          <Pressable onPress={() => router.replace({ pathname: "/sign-in", params: { returnTo, email } })} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        ) : null}
        <Text style={styles.privacyCopy}>Your queue ticket is tied to your Spotly account.</Text>
      </Card>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  authCard: { gap: 16, padding: 18 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.secondary, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  link: { color: colors.brandStrong, fontSize: 13, fontWeight: "700" },
  privacyCopy: { color: colors.secondary, fontSize: 11, lineHeight: 16 },
});

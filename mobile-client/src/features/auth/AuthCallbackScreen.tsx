import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/AuthProvider";
import { Card, colors, LoadingState, Notice, PageFrame, pageTitle } from "../ui";
import { safeReturnTo } from "./returnTo";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { completeAuthRedirect } = useAuth();
  const [working, setWorking] = useState(true);
  const [error, setError] = useState("");
  const handledUrls = useRef(new Set<string>());

  const finishRedirect = useCallback(async (url: string | null) => {
    if (!url || !url.includes("auth/callback") || handledUrls.current.has(url)) return;
    handledUrls.current.add(url);
    setWorking(true);
    setError("");
    try {
      const result = await completeAuthRedirect(url);
      const parsed = new URL(url);
      const returnTo = safeReturnTo(parsed.searchParams.get("returnTo"));
      if (result.type === "recovery") {
        router.replace({ pathname: "/update-password", params: { returnTo } });
      } else if (result.type === "signup") {
        router.replace({ pathname: "/sign-in", params: { returnTo } });
      } else {
        router.replace(returnTo);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This sign-in link could not be completed.");
      setWorking(false);
    }
  }, [completeAuthRedirect, router]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => { void finishRedirect(url); });
    void Linking.getInitialURL().then(finishRedirect).catch(() => {
      setError("This sign-in link could not be opened. Start again from Spotly.");
      setWorking(false);
    });
    return () => subscription.remove();
  }, [finishRedirect]);

  return (
    <PageFrame showNav={false}>
      {pageTitle("Finishing sign-in", "Returning you to Spotly securely.")}
      <Card style={styles.card}>
        {working ? <LoadingState label="Checking your sign-in link…" /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {error ? (
          <Pressable onPress={() => router.replace("/sign-in")} accessibilityRole="button">
            <Text style={styles.link}>Start sign-in again</Text>
          </Pressable>
        ) : null}
      </Card>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  link: { color: colors.brandStrong, fontWeight: "700", fontSize: 14 },
});

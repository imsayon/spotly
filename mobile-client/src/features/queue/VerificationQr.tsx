import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import QRCode from "qrcode";
import api from "../../lib/api";
import { Button, Card, colors, errorMessage, Notice } from "../ui";

type Verification = { token: string; entryId: string; expiresAt: string };

export function VerificationQr({ entryId }: { entryId: string }) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  const { width } = useWindowDimensions();

  useFocusEffect(useCallback(() => () => {
    request.current?.abort();
    setVerification(null);
    setLoading(false);
    request.current = null;
  }, [entryId]));

  useEffect(() => {
    if (!verification) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [verification]);

  const issue = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    setVerification(null);
    try {
      const response = await api.post("/queue/verification/issue", undefined, { signal: controller.signal });
      const value = response.data.data as Verification;
      if (!value || value.entryId !== entryId || !/^[A-Za-z0-9_-]{43}$/.test(value.token) || !(Date.parse(value.expiresAt) > Date.now())) {
        throw new Error("Your ticket changed. Refresh it before showing a verification code.");
      }
      if (!controller.signal.aborted) {
        setNow(Date.now());
        setVerification(value);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause, "Your verification code could not be loaded."));
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const expired = verification && Date.parse(verification.expiresAt) <= now;
  const modules = verification && !expired ? QRCode.create(verification.token, { errorCorrectionLevel: "M" }).modules : null;
  const pixel = modules ? Math.max(1, Math.floor(Math.min(width - 100, 260) / (modules.size + 8))) : 1;

  return (
    <Card>
      <Text style={styles.title}>Verify at the counter</Text>
      <Text style={styles.body}>Show this one-time code to the outlet staff. It expires after 90 seconds.</Text>
      {modules ? <View style={[styles.qr, { padding: pixel * 4 }]} accessible accessibilityLabel="One-time verification QR. Show this code to the outlet staff.">
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {Array.from({ length: modules.size }, (_, row) => <View key={row} style={styles.row}>
            {Array.from({ length: modules.size }, (_, column) => <View key={column} style={{ width: pixel, height: pixel, backgroundColor: modules.get(row, column) ? "#000000" : "#ffffff" }} />)}
          </View>)}
        </View>
      </View> : null}
      {expired ? <Notice>This code expired. Generate a new one when you are at the counter.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button label={verification ? "Generate a new code" : "Show verification code"} onPress={() => void issue()} loading={loading} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  body: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  qr: { alignSelf: "center", backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
});

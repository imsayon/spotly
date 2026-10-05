import { useCallback, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { QueueEntry, QueueStatus } from "@spotly/types";
import api from "../../lib/api";
import { useAuth } from "../../providers/AuthProvider";
import {
  Button,
  Card,
  colors,
  errorMessage,
  LoadingState,
  Notice,
  PageFrame,
  pageTitle,
} from "../ui";

const activeStatuses = new Set<QueueStatus>(["PENDING_ACCEPTANCE", "WAITING", "CALLED"]);
type QueueSnapshotEntry = Pick<QueueEntry, "id" | "outletId" | "status" | "tokenNumber" | "createdAt">;
type Ticket = QueueEntry & {
  outlet?: { name?: string; address?: string | null; merchant?: { name?: string } };
};

function statusMessage(status: QueueStatus, ahead: number | null) {
  if (status === "PENDING_ACCEPTANCE") return ["Request sent", "The outlet must accept your request before your place is confirmed."];
  if (status === "WAITING") {
    const headline = ahead === null ? "Your place is confirmed" : ahead === 0 ? "You’re next" : `${ahead} ${ahead === 1 ? "person" : "people"} ahead`;
    return [headline, "The outlet will call your token when it is your turn."];
  }
  if (status === "CALLED") return ["Your turn", "Please go to the counter now."];
  if (status === "SERVED") return ["Visit complete", "Thanks for using Spotly."];
  if (status === "MISSED") return ["Request ended", "This request expired or was ended by the outlet."];
  if (status === "CANCELLED") return ["You left the queue", "This request cannot be restored."];
  return ["Request ended", "This queue ticket is no longer active."];
}

function statusStyle(status: QueueStatus) {
  if (status === "CALLED" || status === "SERVED") return styles.statusPositive;
  if (status === "MISSED" || status === "CANCELLED") return styles.statusTerminal;
  if (status === "PENDING_ACCEPTANCE") return styles.statusPending;
  return styles.statusWaiting;
}

export default function QueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entryId?: string | string[] }>();
  const entryId = Array.isArray(params.entryId) ? params.entryId[0] : params.entryId;
  const { user, loading: authLoading, identityError } = useAuth();
  const [entry, setEntry] = useState<Ticket | null>(null);
  const [snapshot, setSnapshot] = useState<QueueSnapshotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const requestGeneration = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (authLoading) return;
    const generation = ++requestGeneration.current;
    if (!user) {
      setEntry(null);
      setSnapshot([]);
      setError("");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = entryId
        ? await api.get(`/queue/entry/${encodeURIComponent(entryId)}`)
        : await api.get("/queue/active");
      if (generation !== requestGeneration.current) return;
      const current = (response.data.data || null) as Ticket | null;
      setEntry(current);
      setStale(false);
      if (current && activeStatuses.has(current.status)) {
        try {
          const queueResponse = await api.get(`/queue/outlet/${encodeURIComponent(current.outletId)}`);
          if (generation !== requestGeneration.current) return;
          setSnapshot((queueResponse.data.data || []) as QueueSnapshotEntry[]);
        } catch {
          if (generation !== requestGeneration.current) return;
          setSnapshot([]);
          setStale(true);
        }
      } else {
        setSnapshot([]);
      }
      setLastUpdated(Date.now());
    } catch (cause) {
      if (generation === requestGeneration.current) {
        setError(errorMessage(cause, "Your ticket could not be loaded. Check your connection and try again."));
      }
    } finally {
      if (generation === requestGeneration.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [authLoading, entryId, user]);

  useFocusEffect(useCallback(() => {
    void load();
    const interval = setInterval(() => {
      if (AppState.currentState === "active") void load(true);
    }, 20_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load(true);
    });
    return () => {
      requestGeneration.current += 1;
      clearInterval(interval);
      subscription.remove();
    };
  }, [load]));

  const waitingEntries = snapshot.filter((item) => item.status === "WAITING");
  const aheadIndex = entry ? waitingEntries.findIndex((item) => item.id === entry.id && item.outletId === entry.outletId) : -1;
  const ahead = aheadIndex < 0 ? null : aheadIndex;
  const isActive = !!entry && activeStatuses.has(entry.status);
  const [headline, explanation] = entry ? statusMessage(entry.status, ahead) : ["", ""];

  const cancelRequest = () => {
    if (!entry || !isActive || canceling) return;
    Alert.alert("Cancel this request?", "Your place will be removed and cannot be restored.", [
      { text: "Keep request", style: "cancel" },
      {
        text: "Cancel request",
        style: "destructive",
        onPress: () => {
          setCanceling(true);
          void api.patch(`/queue/entry/${encodeURIComponent(entry.id)}/leave`)
            .then(() => {
              setEntry((current) => current ? { ...current, status: "CANCELLED" } : current);
              setSnapshot([]);
              setStale(false);
              setLastUpdated(Date.now());
            })
            .catch((cause) => {
              Alert.alert("Could not cancel request", errorMessage(cause, "Check your connection and try again."));
              void load(true);
            })
            .finally(() => setCanceling(false));
        },
      },
    ]);
  };

  return (
    <PageFrame activeTab="queue" onRefresh={() => void load(true)} refreshing={refreshing}>
      {pageTitle("Your ticket", "Follow the outlet’s confirmed queue status. Spotly does not estimate wait times.")}
      {authLoading || loading ? <LoadingState label="Loading your ticket…" /> : null}
      {!authLoading && !user ? (
        <Card>
          <Text style={styles.cardTitle}>Sign in to see your turn.</Text>
          <Text style={styles.bodyText}>Your queue ticket is private to your Spotly account. Sign in to continue.</Text>
          <Button label="Sign in" onPress={() => router.push({ pathname: "/sign-in", params: { returnTo: entryId ? `/queue?entryId=${encodeURIComponent(entryId)}` : "/queue" } })} />
        </Card>
      ) : null}
      {identityError && user ? <Notice tone="error">{identityError}</Notice> : null}
      {error && user ? (
        <Card>
          <Notice tone="error">{error}</Notice>
          <Button label="Try again" onPress={() => void load()} />
        </Card>
      ) : null}
      {!authLoading && user && !loading && !error && !entry ? (
        <Card>
          <Text style={styles.cardTitle}>No active request.</Text>
          <Text style={styles.bodyText}>Choose an outlet and request a spot to see your ticket here.</Text>
          <Button label="Discover places" onPress={() => router.replace("/discover")} />
        </Card>
      ) : null}
      {!loading && entry ? (
        <>
          <Card style={styles.ticketCard}>
            <View style={styles.ticketHeading}>
              <View style={styles.ticketCopy}>
                <Text style={styles.kicker}>{entry.outlet?.merchant?.name || "SPOTLY QUEUE"}</Text>
                <Text style={styles.outletName}>{entry.outlet?.name || "Selected outlet"}</Text>
                {entry.outlet?.address ? <Text style={styles.bodyText}>{entry.outlet.address}</Text> : null}
              </View>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenLabel}>TOKEN</Text>
                <Text style={styles.tokenNumber}>{entry.tokenNumber}</Text>
              </View>
            </View>
            <View style={[styles.statusCard, statusStyle(entry.status)]}>
              <Text style={styles.statusHeadline}>{headline}</Text>
              <Text style={styles.statusExplanation}>{explanation}</Text>
            </View>
            {entry.status === "WAITING" && ahead !== null ? (
              <Text style={styles.bodyText}>{ahead === 0 ? "No one is ahead of you in the waiting line." : `${ahead} ${ahead === 1 ? "person is" : "people are"} ahead in the waiting line.`}</Text>
            ) : null}
            {stale && isActive ? <Notice>Ticket status is current, but the outlet’s waiting line could not be refreshed. Pull down to retry.</Notice> : null}
            {lastUpdated ? <Text style={styles.updatedAt}>Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text> : null}
            {isActive ? <Button label="Cancel request" tone="danger" onPress={cancelRequest} loading={canceling} /> : null}
          </Card>
          <Button label="Discover more places" tone="secondary" onPress={() => router.replace("/discover")} />
        </>
      ) : null}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  ticketCard: { padding: 18, gap: 14 },
  ticketHeading: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  ticketCopy: { flex: 1, gap: 5 },
  kicker: { color: colors.brandStrong, fontSize: 10, letterSpacing: 1.2, fontWeight: "800" },
  outletName: { color: colors.ink, fontSize: 19, fontWeight: "700" },
  bodyText: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  tokenBadge: { width: 82, minHeight: 78, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft },
  tokenLabel: { color: colors.brandStrong, fontSize: 9, letterSpacing: 1, fontWeight: "800" },
  tokenNumber: { color: colors.brandStrong, fontSize: 28, lineHeight: 33, fontWeight: "800" },
  statusCard: { borderRadius: 10, padding: 15, gap: 5 },
  statusPositive: { backgroundColor: colors.successSoft },
  statusTerminal: { backgroundColor: colors.raised },
  statusPending: { backgroundColor: colors.warningSoft },
  statusWaiting: { backgroundColor: colors.brandSoft },
  statusHeadline: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  statusExplanation: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  updatedAt: { color: colors.secondary, fontSize: 11 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
});

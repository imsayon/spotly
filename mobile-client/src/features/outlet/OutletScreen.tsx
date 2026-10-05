import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { MenuCategory, QueueEntry } from "@spotly/types";
import type { Outlet } from "@spotly/types";
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

type OutletDetails = Outlet & {
  timezone?: string;
  merchant: { name: string; category: string; description?: string | null; phone?: string | null };
  menuCategories: MenuCategory[];
};
type OutletQueueEntry = Pick<QueueEntry, "id" | "outletId" | "tokenNumber" | "status" | "createdAt">;

export default function OutletScreen() {
  const router = useRouter();
  const { outletId: routeOutletId } = useLocalSearchParams<{ outletId: string }>();
  const outletId = Array.isArray(routeOutletId) ? routeOutletId[0] : routeOutletId;
  const { user, loading: authLoading } = useAuth();
  const [outlet, setOutlet] = useState<OutletDetails | null>(null);
  const [queueEntries, setQueueEntries] = useState<OutletQueueEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [queueError, setQueueError] = useState(false);
  const [revision, setRevision] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!outletId) {
      setError("This outlet link is incomplete.");
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError("");
    setQueueError(false);
    Promise.allSettled([
      api.get(`/outlet/${encodeURIComponent(outletId)}`),
      api.get(`/queue/outlet/${encodeURIComponent(outletId)}`),
    ])
      .then(([outletResult, queueResult]) => {
        if (!mounted) return;
        if (outletResult.status === "fulfilled") {
          setOutlet(outletResult.value.data.data as OutletDetails);
        } else {
          setError(errorMessage(outletResult.reason, "Outlet details could not be loaded."));
        }
        if (queueResult.status === "fulfilled") {
          setQueueEntries((queueResult.value.data.data || []) as OutletQueueEntry[]);
        } else {
          setQueueError(true);
          setQueueEntries([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [outletId, revision]));

  useFocusEffect(useCallback(() => {
    if (authLoading) return;
    if (!user) {
      setActiveEntry(null);
      setActiveLoading(false);
      return;
    }
    let mounted = true;
    setActiveLoading(true);
    api.get("/queue/active")
      .then((response) => {
        if (mounted) setActiveEntry((response.data.data || null) as QueueEntry | null);
      })
      .catch(() => {
        if (mounted) setActiveEntry(null);
      })
      .finally(() => {
        if (mounted) setActiveLoading(false);
      });
    return () => { mounted = false; };
  }, [authLoading, revision, user]));

  const services = useMemo(() =>
    (outlet?.menuCategories || []).flatMap((category) =>
      (category.items || []).map((item) => ({ ...item, categoryName: category.name })),
    ), [outlet?.menuCategories]);

  const waitingCount = queueEntries.filter((entry) => entry.status === "WAITING").length;
  const calledCount = queueEntries.filter((entry) => entry.status === "CALLED").length;

  const joinQueue = async () => {
    if (!outlet || joining || !outlet.isActive) return;
    if (!user) {
      router.push({ pathname: "/sign-in", params: { returnTo: `/outlet/${outlet.id}` } });
      return;
    }
    if (activeEntry) {
      router.push({ pathname: "/queue", params: { entryId: activeEntry.id } });
      return;
    }
    setJoining(true);
    try {
      const response = await api.post("/queue/join", { outletId: outlet.id });
      const entry = response.data.data as QueueEntry;
      setActiveEntry(entry);
      router.push({ pathname: "/queue", params: { entryId: entry.id } });
    } catch (cause) {
      const message = errorMessage(cause, "Your request could not be sent.");
      if (/active queue entry/i.test(message)) {
        const current = await api.get("/queue/active").catch(() => null);
        const entry = current?.data.data as QueueEntry | null | undefined;
        if (entry) {
          setActiveEntry(entry);
          router.push({ pathname: "/queue", params: { entryId: entry.id } });
          return;
        }
      }
      Alert.alert("Request not sent", message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <PageFrame onRefresh={() => setRevision((value) => value + 1)} refreshing={loading}>
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/discover")} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.backLink}>‹  Back to places</Text>
      </Pressable>
      {loading ? <LoadingState label="Loading outlet details…" /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!loading && error ? <Button label="Try again" onPress={() => setRevision((value) => value + 1)} /> : null}
      {!loading && !error && outlet ? (
        <>
          {pageTitle(outlet.merchant.category || "Outlet", outlet.merchant.description || "Review this location and its listed services before requesting a spot.")}
          <Card style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.outletMark}><Text style={styles.outletInitial}>{outlet.merchant.name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={[styles.statusPill, outlet.isActive ? styles.statusOpen : styles.statusPaused]}>
                <Text style={[styles.statusText, outlet.isActive ? styles.statusTextOpen : styles.statusTextPaused]}>{outlet.isActive ? "Requests open" : "Requests paused"}</Text>
              </View>
            </View>
            <Text style={styles.merchantName}>{outlet.merchant.name}</Text>
            <Text style={styles.outletName}>{outlet.name}</Text>
            <Text style={styles.bodyText}>{outlet.address || "Address unavailable"}</Text>
            <View style={styles.queueSummary}>
              <Text style={styles.queueSummaryTitle}>Current queue</Text>
              <Text style={styles.queueSummaryText}>
                {queueError ? "Queue status is unavailable" : queueEntries.length ? `${waitingCount} waiting · ${calledCount} called` : "No active requests right now"}
              </Text>
            </View>
            {queueError ? <Text style={styles.bodyText}>Outlet details are available. Queue status will refresh when you retry.</Text> : null}
            {activeEntry ? (
              <Notice tone="success">You already have an active Spotly request. You can follow it here.</Notice>
            ) : null}
            <Button
              label={activeEntry ? "View your active ticket" : "Request a spot"}
              onPress={() => void joinQueue()}
              disabled={!outlet.isActive || authLoading || activeLoading}
              loading={joining || activeLoading}
            />
            {!outlet.isActive ? <Text style={styles.bodyText}>This outlet has paused new requests. Check back later.</Text> : null}
          </Card>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Listed services</Text>
            <Text style={styles.sectionMeta}>{services.length} listed</Text>
          </View>
          {services.length ? services.map((service) => (
            <Card key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.bodyText}>{service.categoryName}</Text>
                </View>
                <Text style={service.isAvailable ? styles.servicePrice : styles.unavailable}>
                  {service.isAvailable ? `₹${Number(service.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Unavailable"}
                </Text>
              </View>
              {service.description ? <Text style={styles.bodyText}>{service.description}</Text> : null}
            </Card>
          )) : (
            <Card><Text style={styles.bodyText}>No services have been listed for this outlet.</Text></Card>
          )}
          <Notice>Requests join this outlet’s queue. Service selection is not part of the current queue request.</Notice>
        </>
      ) : null}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  backLink: { color: colors.brandStrong, fontSize: 14, fontWeight: "700", paddingVertical: 3 },
  heroCard: { padding: 18, gap: 9 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  outletMark: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft },
  outletInitial: { color: colors.brandStrong, fontSize: 20, fontWeight: "800" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  statusOpen: { backgroundColor: colors.successSoft },
  statusPaused: { backgroundColor: colors.raised },
  statusText: { fontSize: 11, fontWeight: "800" },
  statusTextOpen: { color: colors.success },
  statusTextPaused: { color: colors.secondary },
  merchantName: { color: colors.brandStrong, fontSize: 13, fontWeight: "700" },
  outletName: { color: colors.ink, fontSize: 27, lineHeight: 32, letterSpacing: -0.6, fontWeight: "700" },
  bodyText: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  queueSummary: { marginVertical: 4, padding: 13, borderRadius: 9, backgroundColor: colors.raised, gap: 3 },
  queueSummaryTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  queueSummaryText: { color: colors.secondary, fontSize: 13 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  sectionMeta: { color: colors.secondary, fontSize: 12 },
  serviceCard: { padding: 14 },
  serviceTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  serviceCopy: { flex: 1, gap: 4 },
  serviceName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  servicePrice: { color: colors.brandStrong, fontSize: 14, fontWeight: "800" },
  unavailable: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
});

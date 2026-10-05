import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import api from "../../lib/api";
import {
  Button,
  Card,
  colors,
  errorMessage,
  Field,
  formatDistance,
  LoadingState,
  Notice,
  PageFrame,
  pageTitle,
} from "../ui";

type Center = { latitude: number; longitude: number; label: string };
type DiscoveryOutlet = {
  id: string;
  merchantId: string;
  name: string;
  address: string | null;
  isActive: boolean;
  distanceMeters: number | null;
  merchant: { name: string; category: string; verified: boolean };
};
type AreaResult = { label: string; latitude: number; longitude: number };
type SearchMode = "nearby" | "global";

export default function DiscoveryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [center, setCenter] = useState<Center | null>(null);
  const [mode, setMode] = useState<SearchMode | null>(null);
  const [outlets, setOutlets] = useState<DiscoveryOutlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areaPanelOpen, setAreaPanelOpen] = useState(false);
  const [areaQuery, setAreaQuery] = useState("");
  const [areas, setAreas] = useState<AreaResult[]>([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaError, setAreaError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);
  const categoryScope = useRef("");

  const runSearch = useCallback(async (
    next: { query?: string; category?: string; center?: Center | null } = {},
  ) => {
    const searchText = (next.query ?? query).trim();
    const selectedCenter = next.center !== undefined ? next.center : mode === "global" ? null : center;
    if (!selectedCenter && !searchText) {
      requestId.current += 1;
      setLoading(false);
      setError("Use your location or enter a business, category, or place name to search everywhere.");
      setOutlets([]);
      setSearched(false);
      return;
    }

    const searchMode: SearchMode = selectedCenter ? "nearby" : "global";
    const scope = `${searchMode}|${searchText.toLocaleLowerCase()}|${selectedCenter ? `${selectedCenter.latitude},${selectedCenter.longitude}` : "global"}`;
    const scopeChanged = categoryScope.current !== scope;
    const selectedCategory = next.category ?? (scopeChanged ? "All" : category);
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setMode(searchMode);
    setSearched(true);
    try {
      const params: Record<string, string | number> = {
        mode: searchMode,
        limit: 50,
      };
      if (searchText) params.q = searchText;
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedCenter) {
        params.lat = selectedCenter.latitude;
        params.lng = selectedCenter.longitude;
      }
      const response = await api.get("/outlet/discover", { params });
      if (currentRequest !== requestId.current) return;
      const items = (response.data.data?.items || []) as DiscoveryOutlet[];
      setOutlets(items);
      const foundCategories = items.map((outlet) => outlet.merchant.category).filter(Boolean);
      if (scopeChanged) {
        categoryScope.current = scope;
        setCategory("All");
        setCategories(["All", ...Array.from(new Set(foundCategories))]);
      } else {
        setCategories((current) => ["All", ...Array.from(new Set([...current.filter((value) => value !== "All"), ...foundCategories]))]);
      }
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(errorMessage(cause, "Places could not be loaded. Check your connection and try again."));
        setOutlets([]);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [category, center, mode, query]);

  const useCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationMessage("Location access is off. Search everywhere or choose an area by name.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextCenter = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: "Current location",
      };
      setCenter(nextCenter);
      setLocationMessage("");
      await runSearch({ center: nextCenter });
    } catch (cause) {
      setLocationMessage(errorMessage(cause, "Could not read your location. Choose an area or search everywhere."));
    } finally {
      setLocationLoading(false);
    }
  }, [runSearch]);

  const searchAreas = useCallback(async () => {
    const value = areaQuery.trim();
    if (value.length < 2) {
      setAreaError("Enter at least two characters.");
      return;
    }
    setAreaLoading(true);
    setAreaError("");
    try {
      const response = await api.get("/location/search", { params: { q: value } });
      setAreas((response.data.data?.items || []) as AreaResult[]);
      if (!response.data.data?.items?.length) setAreaError("No matching places found. Try a city or neighborhood.");
    } catch (cause) {
      setAreas([]);
      setAreaError(errorMessage(cause, "That place could not be found. Try again shortly."));
    } finally {
      setAreaLoading(false);
    }
  }, [areaQuery]);

  const selectArea = (area: AreaResult) => {
    const nextCenter = { latitude: area.latitude, longitude: area.longitude, label: area.label };
    setCenter(nextCenter);
    setAreaPanelOpen(false);
    setAreas([]);
    setCategory("All");
    void runSearch({ center: nextCenter, category: "All" });
  };

  const selectCategory = (value: string) => {
    setCategory(value);
    if (searched) void runSearch({ category: value });
  };

  return (
    <PageFrame activeTab="discover">
      {pageTitle("Find a place", "Discover nearby outlets, review their listed services, and request a spot when you’re ready.")}

      <Card style={styles.searchCard}>
        <Field
          label="Business or place"
          value={query}
          onChangeText={setQuery}
          placeholder="Try a business name, category, or area"
          returnKeyType="search"
          onSubmitEditing={() => void runSearch()}
        />
        <View style={styles.searchActions}>
          <Button label="Search" onPress={() => void runSearch()} loading={loading} />
          <Button label={center ? "Use my location" : "Find nearby"} tone="secondary" onPress={() => void useCurrentLocation()} loading={locationLoading} />
          {center ? <Button label="Search everywhere" tone="quiet" onPress={() => void runSearch({ center: null })} loading={loading} /> : null}
        </View>
        {center ? <Text style={styles.locationLabel}>Area: {center.label}</Text> : null}
        <Pressable onPress={() => setAreaPanelOpen((open) => !open)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.textLink}>{areaPanelOpen ? "Close area search" : "Choose an area by name"}</Text>
        </Pressable>
        {locationMessage ? <Notice>{locationMessage}</Notice> : null}
      </Card>

      {areaPanelOpen ? (
        <Card>
          <Field
            label="City or neighborhood"
            value={areaQuery}
            onChangeText={setAreaQuery}
            placeholder="Search for an area"
            returnKeyType="search"
            onSubmitEditing={() => void searchAreas()}
          />
          <Button label="Find area" onPress={() => void searchAreas()} loading={areaLoading} />
          {areaError ? <Notice tone="error">{areaError}</Notice> : null}
          {areas.map((area, index) => (
            <Pressable key={`${area.latitude}:${area.longitude}:${index}`} style={styles.areaOption} onPress={() => selectArea(area)} accessibilityRole="button">
              <Text style={styles.areaLabel}>{area.label}</Text>
              <Text style={styles.textLink}>Use this area</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      <View style={styles.resultsHeading}>
        <View>
          <Text style={styles.kicker}>{mode === "nearby" ? "NEARBY" : mode === "global" ? "SEARCH RESULTS" : "YOUR NEXT STOP"}</Text>
          <Text style={styles.sectionTitle}>{loading ? "Finding places…" : searched ? `${outlets.length} ${outlets.length === 1 ? "outlet" : "outlets"}` : "Ready when you are"}</Text>
        </View>
        {error ? <Pressable onPress={() => void runSearch()} accessibilityRole="button"><Text style={styles.textLink}>Retry</Text></Pressable> : null}
      </View>

      {searched && outlets.length > 0 ? (
        <View style={styles.categoryRow}>
          {categories.map((value) => (
            <Pressable key={value} onPress={() => selectCategory(value)} style={[styles.categoryChip, category === value && styles.categoryChipActive]} accessibilityRole="button" accessibilityState={{ selected: category === value }}>
              <Text style={[styles.categoryLabel, category === value && styles.categoryLabelActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? <LoadingState label="Looking for nearby places…" /> : null}
      {!loading && !searched ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Start with a place or a search.</Text>
          <Text style={styles.bodyText}>Allow location for outlets within 10 km, or search everywhere by business, category, or place name.</Text>
          <Button label="Find places near me" onPress={() => void useCurrentLocation()} loading={locationLoading} />
        </Card>
      ) : null}
      {!loading && searched && !error && outlets.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No outlets found</Text>
          <Text style={styles.bodyText}>Try a different search, category, or area.</Text>
        </Card>
      ) : null}
      {!loading ? outlets.map((outlet) => (
        <Pressable
          key={outlet.id}
          onPress={() => router.push({ pathname: "/outlet/[outletId]", params: { outletId: outlet.id } })}
          accessibilityRole="button"
          accessibilityLabel={`View ${outlet.name} at ${outlet.merchant.name}`}
        >
          <Card style={styles.outletCard}>
            <View style={styles.outletTop}>
              <View style={styles.outletMark}><Text style={styles.outletInitial}>{outlet.merchant.name?.slice(0, 1).toUpperCase() || "S"}</Text></View>
              <View style={styles.outletStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: outlet.isActive ? colors.success : colors.subtle }]} />
                <Text style={styles.outletStatus}>{outlet.isActive ? "Requests open" : "Paused"}</Text>
              </View>
            </View>
            <Text style={styles.merchantName}>{outlet.merchant.name}</Text>
            <Text style={styles.outletName}>{outlet.name}</Text>
            <Text style={styles.bodyText}>{outlet.merchant.category}{outlet.address ? ` · ${outlet.address}` : ""}</Text>
            <View style={styles.outletFooter}>
              <Text style={styles.distance}>{formatDistance(outlet.distanceMeters) || "View outlet details"}</Text>
              <Text style={styles.openDetails}>Details  →</Text>
            </View>
          </Card>
        </Pressable>
      )) : null}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  searchCard: { gap: 14 },
  searchActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  locationLabel: { color: colors.secondary, fontSize: 12 },
  textLink: { color: colors.brandStrong, fontWeight: "700", fontSize: 13 },
  areaOption: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  areaLabel: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  resultsHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 8 },
  kicker: { color: colors.brandStrong, fontSize: 10, letterSpacing: 1.3, fontWeight: "800" },
  sectionTitle: { marginTop: 5, color: colors.ink, fontSize: 20, fontWeight: "700" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 99, backgroundColor: colors.surface },
  categoryChipActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  categoryLabel: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
  categoryLabelActive: { color: colors.white },
  emptyCard: { alignItems: "flex-start", backgroundColor: colors.surface },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  bodyText: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  outletCard: { gap: 7, padding: 16 },
  outletTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  outletMark: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft },
  outletInitial: { color: colors.brandStrong, fontSize: 18, fontWeight: "800" },
  outletStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  outletStatus: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  merchantName: { color: colors.brandStrong, fontSize: 12, fontWeight: "700" },
  outletName: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  outletFooter: { marginTop: 6, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  distance: { color: colors.secondary, fontSize: 12 },
  openDetails: { color: colors.brandStrong, fontSize: 13, fontWeight: "800" },
});

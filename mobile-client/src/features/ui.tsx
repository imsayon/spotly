import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../providers/AuthProvider";

export const colors = {
  page: "#faf7f2",
  surface: "#fffdf9",
  raised: "#eee6da",
  ink: "#282723",
  secondary: "#6a6259",
  subtle: "#a29a90",
  border: "#d8cfc2",
  brand: "#b34c35",
  brandStrong: "#963c29",
  brandSoft: "#f4dfd8",
  success: "#2f6b52",
  successSoft: "#e1efe8",
  warning: "#a5661b",
  warningSoft: "#f8ecd8",
  danger: "#b6443c",
  dangerSoft: "#f8e1de",
  white: "#fffdf9",
};

type PageFrameProps = {
  children: ReactNode;
  activeTab?: "discover" | "queue";
  showNav?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function PageFrame({
  children,
  activeTab,
  showNav = true,
  refreshing = false,
  onRefresh,
}: PageFrameProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in at any time.", [
      { text: "Stay", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/")).catch(() => {
            Alert.alert("Could not sign out", "Check your connection and try again.");
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.brandLockup} onPress={() => router.replace("/")} accessibilityRole="button" accessibilityLabel="Spotly home">
          <View style={styles.brandMark}><Text style={styles.brandLetter}>S</Text></View>
          <Text style={styles.brandName}>Spotly</Text>
        </Pressable>
        {user ? (
          <Pressable onPress={handleSignOut} hitSlop={8} accessibilityRole="button">
            <Text style={styles.headerAction}>Sign out</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push("/sign-in")} hitSlop={8} accessibilityRole="button">
            <Text style={styles.headerAction}>Sign in</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        ) : undefined}
      >
        {children}
      </ScrollView>
      {showNav ? (
        <View style={styles.bottomNav}>
          <Pressable
            style={[styles.navItem, activeTab === "discover" && styles.navItemActive]}
            onPress={() => router.replace("/")}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === "discover" }}
          >
            <Text style={[styles.navLabel, activeTab === "discover" && styles.navLabelActive]}>Discover</Text>
          </Pressable>
          <Pressable
            style={[styles.navItem, activeTab === "queue" && styles.navItemActive]}
            onPress={() => router.replace("/queue")}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === "queue" }}
          >
            <Text style={[styles.navLabel, activeTab === "queue" && styles.navLabelActive]}>Your ticket</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "secondary" | "quiet" | "danger";
};

export function Button({ label, onPress, disabled = false, loading = false, tone = "primary" }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        tone === "primary" && styles.buttonPrimary,
        tone === "secondary" && styles.buttonSecondary,
        tone === "quiet" && styles.buttonQuiet,
        tone === "danger" && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? <ActivityIndicator color={tone === "primary" || tone === "danger" ? colors.white : colors.brandStrong} /> : <Text style={[styles.buttonLabel, (tone === "secondary" || tone === "quiet") && styles.buttonLabelDark, tone === "danger" && styles.buttonDangerLabel]}>{label}</Text>}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; hint?: string };

export function Field({ label, hint, style, ...inputProps }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.fieldInput, style]}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.brand}
        accessibilityLabel={label}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" }) {
  return (
    <View style={[styles.notice, tone === "error" && styles.noticeError, tone === "success" && styles.noticeSuccess]} accessibilityRole={tone === "error" ? "alert" : "text"}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <View style={styles.loadingState}><ActivityIndicator color={colors.brand} /><Text style={styles.loadingLabel}>{label}</Text></View>;
}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function formatDistance(meters?: number | null) {
  if (meters == null || !Number.isFinite(meters)) return null;
  return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

export function pageTitle(title: string, subtitle: string) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.kicker}>SPOTLY · {title.toUpperCase()}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.page },
  header: { minHeight: 60, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.page },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  brandLetter: { color: colors.white, fontSize: 18, fontWeight: "800" },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: "700", letterSpacing: -0.4 },
  headerAction: { color: colors.brandStrong, fontWeight: "700", fontSize: 14 },
  scroll: { flex: 1 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 34, gap: 18 },
  bottomNav: { minHeight: 62, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  navItemActive: { backgroundColor: colors.brandSoft },
  navLabel: { color: colors.secondary, fontWeight: "700", fontSize: 13 },
  navLabelActive: { color: colors.brandStrong },
  button: { minHeight: 48, paddingHorizontal: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  buttonPrimary: { backgroundColor: colors.brand },
  buttonSecondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonQuiet: { backgroundColor: "transparent" },
  buttonDanger: { backgroundColor: colors.danger },
  buttonDisabled: { opacity: 0.56 },
  buttonPressed: { opacity: 0.8 },
  buttonLabel: { color: colors.white, fontSize: 14, fontWeight: "700" },
  buttonLabelDark: { color: colors.ink },
  buttonDangerLabel: { color: colors.white },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  fieldInput: { minHeight: 48, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.ink, backgroundColor: colors.surface, fontSize: 15 },
  fieldHint: { color: colors.secondary, fontSize: 12 },
  card: { padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, gap: 10 },
  notice: { padding: 13, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  noticeError: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  noticeSuccess: { backgroundColor: colors.successSoft, borderColor: colors.success },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  loadingState: { minHeight: 130, gap: 12, alignItems: "center", justifyContent: "center" },
  loadingLabel: { color: colors.secondary, fontSize: 14 },
  pageHeading: { gap: 8 },
  kicker: { color: colors.brandStrong, fontSize: 11, letterSpacing: 1.4, fontWeight: "800" },
  pageTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: "700" },
  pageSubtitle: { maxWidth: 620, color: colors.secondary, fontSize: 15, lineHeight: 22 },
});

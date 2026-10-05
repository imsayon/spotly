import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors, PageFrame } from "../ui";

const merchantUrl =
  process.env.EXPO_PUBLIC_MERCHANT_URL ??
  "https://spotly-merchant-ob90.onrender.com";

const steps = [
  ["01", "Find a place", "Browse local businesses."],
  ["02", "Request a spot", "The business confirms your place."],
  ["03", "Follow your turn", "See your latest queue status."],
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  const openMerchantWorkspace = () => {
    void Linking.openURL(merchantUrl).catch(() => {
      Alert.alert(
        "Could not open Spotly for business",
        "Check your connection and try again.",
      );
    });
  };

  return (
    <PageFrame showNav={false}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>A CLEARER WAY TO VISIT</Text>
        <Text style={styles.title}>Your place in line.</Text>
        <Text style={styles.subtitle}>A clearer kind of day.</Text>
        <Text style={styles.description}>
          Find a local business, request a spot, and follow your turn.
        </Text>
      </View>

      <Card style={styles.consumerCard}>
        <Text style={styles.consumerKicker}>FOR CUSTOMERS</Text>
        <Text style={styles.cardTitle}>Find a place for your next visit.</Text>
        <Text style={styles.cardDescription}>
          Explore local businesses, request a spot, and follow your turn.
        </Text>
        <Pressable
          onPress={() => router.push("/discover")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.customerAction, pressed && styles.pressed]}
        >
          <Text style={styles.customerActionText}>Find a place</Text>
          <Text style={styles.customerActionArrow}>→</Text>
        </Pressable>
      </Card>

      <Card style={styles.merchantCard}>
        <Text style={styles.merchantKicker}>FOR BUSINESSES</Text>
        <Text style={styles.cardTitle}>A calmer front desk.</Text>
        <Text style={styles.cardDescription}>
          Manage requests and call the next customer from Spotly for business.
        </Text>
        <Pressable
          onPress={openMerchantWorkspace}
          accessibilityRole="link"
          accessibilityHint="Opens the business portal in your browser"
          style={({ pressed }) => [styles.merchantAction, pressed && styles.pressed]}
        >
          <Text style={styles.merchantActionText}>Open business portal</Text>
          <Text style={styles.merchantActionArrow}>↗</Text>
        </Pressable>
      </Card>

      <View style={styles.stepsSection}>
        <Text style={styles.stepsHeading}>How Spotly works</Text>
        {steps.map(([number, title, description]) => (
          <View key={number} style={styles.step}>
            <Text style={styles.stepNumber}>{number}</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Browse places without signing in.</Text>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 5, paddingTop: 8, paddingBottom: 5 },
  eyebrow: {
    color: colors.brandStrong,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "800",
    marginBottom: 5,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    fontWeight: "500",
  },
  description: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 5,
    maxWidth: 600,
  },
  consumerCard: { gap: 8, padding: 18, borderTopWidth: 3, borderTopColor: colors.brand },
  merchantCard: {
    gap: 8,
    padding: 18,
    borderTopWidth: 3,
    borderTopColor: colors.merchantBrand,
  },
  consumerKicker: {
    color: colors.brandStrong,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  merchantKicker: {
    color: colors.merchantBrand,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  cardTitle: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: "700" },
  cardDescription: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  customerAction: {
    minHeight: 48,
    marginTop: 4,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerActionText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  customerActionArrow: { color: colors.white, fontSize: 18 },
  merchantAction: {
    minHeight: 48,
    marginTop: 4,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.merchantBorder,
    borderRadius: 9,
    backgroundColor: colors.merchantSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  merchantActionText: { color: colors.merchantBrand, fontSize: 14, fontWeight: "700" },
  merchantActionArrow: { color: colors.merchantBrand, fontSize: 16 },
  pressed: { opacity: 0.78 },
  stepsSection: { gap: 14, paddingTop: 4 },
  stepsHeading: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepNumber: {
    color: colors.brandStrong,
    fontSize: 11,
    letterSpacing: 0.7,
    fontWeight: "800",
    paddingTop: 2,
  },
  stepCopy: { flex: 1, gap: 2 },
  stepTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  stepDescription: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
  footer: { color: colors.secondary, fontSize: 12, paddingTop: 2 },
});

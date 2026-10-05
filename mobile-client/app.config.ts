import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Spotly",
  slug: "spotly",
  version: "1.0.2",
  scheme: "com.pingfloyd.spotly",
  icon: "./assets/spotly-app-icon.png",
  platforms: ["android", "ios"],
  orientation: "portrait",
  android: {
    package: "com.pingfloyd.spotly",
    versionCode: 3,
    adaptiveIcon: {
      foregroundImage: "./assets/spotly-adaptive-icon.png",
      backgroundColor: "#faf7f2",
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow Spotly to find nearby outlets while you use the app.",
      },
    ],
    "./plugins/with-android-release-signing.js",
  ],
};

export default config;

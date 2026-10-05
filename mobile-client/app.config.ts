import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Spotly",
  slug: "spotly",
  version: "1.0.1",
  scheme: "com.pingfloyd.spotly",
  platforms: ["android", "ios"],
  orientation: "portrait",
  android: {
    package: "com.pingfloyd.spotly",
    versionCode: 2,
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

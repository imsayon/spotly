const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes("spotlyReleaseSigning")) return config;

    const buildTypesIndex = contents.indexOf("buildTypes {");
    if (buildTypesIndex < 0) {
      throw new Error("Could not find Android buildTypes block for release signing.");
    }

    const signingConfig = `signingConfigs {
        spotlyReleaseSigning {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "missing-release-keystore.jks")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: ""
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: ""
        }
    }

    `;
    let updated = `${contents.slice(0, buildTypesIndex)}${signingConfig}${contents.slice(buildTypesIndex)}`;
    const releaseSigning = /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?signingConfig)\s+signingConfigs\.\w+/;
    if (!releaseSigning.test(updated)) {
      throw new Error("Could not find the Android release signingConfig line.");
    }
    updated = updated.replace(releaseSigning, "$1 signingConfigs.spotlyReleaseSigning");
    config.modResults.contents = updated;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;

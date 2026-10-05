# Android APK releases

Android releases use a separate GitHub Actions workflow. It builds the Expo app in `mobile-client`, signs a release APK, verifies the signature, and attaches the APK and SHA-256 checksum to a GitHub Release. Render's web/API workflow is unchanged.

## One-time GitHub configuration

In **Settings → Secrets and variables → Actions**, add these repository **secrets**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the Android upload keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Signing key alias |
| `ANDROID_KEY_PASSWORD` | Signing key password |

Create a long-lived upload key once from a private directory outside the repository, and keep a protected backup. Android updates must continue using the same signing key. For example, this prompts for the passwords instead of placing them in shell history:

```sh
umask 077
keytool -genkeypair -v -keystore spotly-upload.jks -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 -alias spotly-upload
base64 -w0 spotly-upload.jks > spotly-upload.jks.b64
```

Add the contents of `spotly-upload.jks.b64` as `ANDROID_KEYSTORE_BASE64`, then remove the encoded copy after GitHub confirms it was saved. Keep the original keystore and its passwords in a private backup. Never commit either file. The workflow decodes the keystore into the runner's temporary directory and fails before building if any signing value is missing.

Add these repository **variables** in the same Actions settings page:

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Full API prefix, including `/api/v1` (for production: `https://spotly-api-d1dr.onrender.com/api/v1`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Spotly Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's publishable client key |

The Supabase URL and publishable key are public client configuration embedded in the APK. Do not use a Supabase service-role or secret key.

## Android developer verification

Google's [current FAQ](https://developer.android.com/developer-verification/guides/faq) says the September 30, 2026 requirement applies to participating app stores; direct APK sideloading is not subject to that initial enforcement. Google recommends preparing for a global rollout in 2027. No registration step blocks this GitHub Releases distribution today. Before that rollout, register `com.pingfloyd.spotly` and its signing key under a verified developer account. The certificate fingerprint for the upload key can be inspected with `keytool -list -v -keystore spotly-upload.jks -alias spotly-upload`.

## Publish a build

Set `version` in `mobile-client/app.config.ts` to match the release version and increase `android.versionCode` in that file for every release; commit the change, then push a matching tag such as:

```sh
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

The `Android APK release` workflow runs only for `mobile-v*` tags. A successful run creates a GitHub Release with `Spotly-mobile-v1.0.0.apk` and its `.sha256` file. Download the APK from Releases and install it on a registered tester device, or use:

```sh
adb install -r Spotly-mobile-v1.0.0.apk
```

Do not reuse a release tag. Fix the source and publish a new, higher version and tag.

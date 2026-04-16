# Simplification of Auth & Consumer Landing Fix

This plan simplifies the authentication flow to Google OAuth only (via Supabase) as requested, and resolves the issue where the consumer landing page renders a blank screen.

## User Review Required

> [!IMPORTANT]
> - Email/Password authentication will be hidden/removed from the UI to prevent "email rate limit exceeded" errors and simplify the onboarding flow.
> - Authentication will now rely exclusively on the **Sign in with Google** button in the Auth Modal.

## Proposed Changes

### [Component] Shared UI Package (`@spotly/ui`)

#### [MODIFY] [Icons.tsx](file:///home/iamsayon/Desktop/Projects/spotly/packages/ui/src/components/Icons.tsx)
- Add a Google G-Logo icon to the `Ic` collection for use in the sign-in button.

#### [MODIFY] [AuthModal.tsx](file:///home/iamsayon/Desktop/Projects/spotly/packages/ui/src/components/AuthModal.tsx)
- Add `onGoogleAuth: () => Promise<void>` to `AuthModalProps`.
- Remove the email and password form fields.
- Add a prominent "Continue with Google" button that triggers `onGoogleAuth`.
- Maintain the modal layout and aesthetics (glassmorphism, accent glows).

### [Component] Consumer App (`apps/consumer`)

#### [MODIFY] [page.tsx](file:///home/iamsayon/Desktop/Projects/spotly/apps/consumer/src/app/page.tsx)
- Update `AuthModal` usage to include `onGoogleAuth={signInWithGoogle}`.
- Refactor the `loading` check: If `loading` is true for more than 3 seconds, allow rendering or show a minimal "Connecting..." state to prevent permanent blank screen.
- Ensure the `AuthModal` title correctly reflects the context ("Spotly Consumer").

### [Component] Merchant App (`apps/merchant`)

#### [MODIFY] [page.tsx](file:///home/iamsayon/Desktop/Projects/spotly/apps/merchant/src/app/page.tsx)
- Update `AuthModal` usage to include `onGoogleAuth={signInWithGoogle}`.
- Remove old email/password auth handlers from the landing page.

## Open Questions

- Should I add a "Continue as Guest" option to the consumer app to allow browsing without sign-in, or is Google login mandatory for discovery?
- Is there a specific redirect URL you'd like for Google Auth other than `/home`?

## Verification Plan

### Automated Tests
- `pnpm build` across the workspace to ensure no static chunk errors.
- Manual check of the root route (`/`) to verify it redirects to `/home` or shows the landing page.

### Manual Verification
- Clicking "Find Nearby" on consumer landing -> Google Login button appears.
- Clicking "Login" on merchant landing -> Google Login button appears.
- Verifying the blank screen is resolved in `apps/consumer`.

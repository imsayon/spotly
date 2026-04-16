# Spotly Professionalized Migration - Final Phase

This plan covers resolving the remaining build-time configuration issues and completing the integration of the professionalized Merchant and Consumer dashboards.

## User Review Required

> [!IMPORTANT]
> **Build Stability**: I have identified that the large inline style objects in the landing pages were causing SWC compilation errors. I will move these to separate `.styles.ts` files to ensure stability.
> 
> **Feature Completion**: I will be implementing the Queue Operator view, Outlet Management, and Analytics pages which were described in the prototype but are currently missing or mocked in the monorepo.

## Proposed Changes

### Shared Infrastructure (`packages/ui`)

#### [MODIFY] [Icons.tsx](file:///home/iamsayon/Desktop/Projects/spotly/packages/ui/src/components/Icons.tsx)
- Ensure all icons needed for the operator and analytics views are included.

#### [NEW] [shared-styles.ts](file:///home/iamsayon/Desktop/Projects/spotly/packages/ui/src/styles/shared-styles.ts)
- Move universal styles (glass, gradients, buttons) from the prototype into a shared utility file to prevent redundant code and parser issues.

---

### Consumer App (`apps/consumer`)

#### [MODIFY] [page.tsx](file:///home/iamsayon/Desktop/Projects/spotly/apps/consumer/src/app/page.tsx)
- Restore professional landing page using the new modular style system.
- Ensure all interactive elements (AuthModal) are wired correctly.

#### [NEW] [landing.styles.ts](file:///home/iamsayon/Desktop/Projects/spotly/apps/consumer/src/app/landing.styles.ts)
- Isolate landing page logic from its 200+ lines of CSS-in-JS.

---

### Merchant App (`apps/merchant`)

#### [NEW] [Queue Operator Page](file:///home/iamsayon/Desktop/Projects/spotly/apps/merchant/src/app/dashboard/queue/page.tsx)
- Implement the "Live Queue" operator view with the ability to call markers, skip entries, and mark as completed.
- Connect to the `@spotly/api` endpoints.

#### [NEW] [Outlets Management](file:///home/iamsayon/Desktop/Projects/spotly/apps/merchant/src/app/dashboard/outlets/page.tsx)
- Implement the grid view for multiple outlets and active status toggles.

#### [NEW] [Analytics Dashboard](file:///home/iamsayon/Desktop/Projects/spotly/apps/merchant/src/app/dashboard/analytics/page.tsx)
- Implement the charts and metrics preview (Avg Wait Time, Peak Hours, etc.).

---

### Backend & Data (`packages/database`)

#### [MODIFY] [seed.ts](file:///home/iamsayon/Desktop/Projects/spotly/packages/database/prisma/seed.ts)
- Populate the database with the "Coffee Lab" and other merchants from the prototype to ensure a working demonstration.

## Open Questions

> [!WARNING]
> Should the "Queue Operator" view use WebSockets for real-time updates (recommended), or stick to polling for the first version? 

## Verification Plan

### Automated Tests
- `pnpm build`: Verify all applications build without syntax errors.
- `tsc --noEmit`: Run type checking across the entire monorepo.

### Manual Verification
- **Consumer Flow**: Landing -> Sign In -> Home -> Join Queue -> View Token.
- **Merchant Flow**: Landing -> Sign In -> Dashboard -> Choose Outlet -> Open Queue Operator -> Call Next.
- **Cross-App Sync**: Confirm joining a queue as a Consumer immediately appears on the Merchant's Operator view.

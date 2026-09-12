# Final frontend maintainer review

## Direction and scope

The September 12 user reference supersedes the earlier all-light composition: dark consumer navigation, dark Jade current-call surface, a shared two-part Spotly mark, and restrained neighborhood photography across working pages. Consumer actions remain Terracotta and merchant actions remain Jade. IBM Plex Sans stays the UI font; only consumer editorial headings use Plex Serif. No theme switch, glass layer, new UI framework, or backend redesign was introduced.

One original generated architectural image is served locally as a 204 KB WebP in each independent static export. It is decorative, not a claim about a real business. The original generated PNG remains outside the repository.

## Corrections

- Replaced per-component toast state with shared, accessible notifications; errors remain dismissible until acknowledged.
- Fixed reversed pause confirmation, guarded stale/duplicate queue mutations, retained last successful queue snapshots, and ignored responses from previous outlets/subscriptions. Failed mutations refresh server state before retry.
- Replaced fabricated “next” for a missing queue entry with an unknown position. Position derives from outlet + entry UUID and WAITING entries only. Terminal tickets survive failure to load the public queue; the tracker exposes refresh and stale state.
- Wrapped merchant detail in the consumer shell, preserved existing tickets when requesting at another outlet, and prevented unresolved identity from starting a request.
- Corrected review retry, stale review data, midnight activity binning, activity request races, empty service states, outlet deletion selection, and QR download.
- Fixed callback return-path validation and recovery routing, stopped registering a merchant merely because a merchant profile is absent, and isolated the historical preview from the auth provider.
- Added keyboard-accessible native merchant navigation dialog, visible form errors inside dialogs, active navigation semantics, consistent focus treatment, and reduced-motion rules.
- Removed unused auth/onboarding modal components, obsolete theme components/styles and no-op layout wrapper, unused merchant serif download, unused motion dependency, and unused code. Formatted previously compressed JSX for maintenance.
- Kept backend changes to owner-checked service editing and transactional protection against deleting outlets with active entries.

## Verification and limits

See `qa/final-render-results.json` for the final static-export browser run and `scripts/frontend-qa.cjs` for reproducibility. The runner blocks external requests and supplies synthetic responses at the browser boundary; production code contains no fixture injection. The old `/design-preview` remains explicitly labeled historical and unavailable in production. It is not evidence for final production screens.

Commands: `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`. Lint uses the existing TypeScript compiler's strict unused-code checks, not ESLint. Removed the stale ESLint stubs that extended a nonexistent root config; no lint dependencies were added.

The Node suite checks production queue derivation/store behavior and the existing server authorization/transition contracts. Browser checks cover the real consumer and merchant route components, overflow and runtime exceptions, and mobile navigation keyboard handling. This is fixture-backed local evidence, not a real Supabase sign-in or multi-device realtime verification. Live authentication, email delivery, production sockets, external map services, and deployment remain unverified.

Historical root QA captures were preserved under the Codex visualization directory instead of committing dozens of redundant screenshots. Current captures remain in `docs/frontend-design/qa/` locally. Approved atlas and decisions are retained with this handoff.

## Final local result — 2026-09-13

- PASS: `pnpm lint` (both clients; strict TypeScript unused-code checks).
- PASS: `pnpm type-check` and the full workspace build; both frontend static exports rebuilt after the final fixes.
- PASS: `pnpm test` — 12 tests, zero failures.
- PASS: 39 final static-export route renders: 13 production routes at 360, 768 and 1440 px; no horizontal overflow or uncaught page exceptions. Mobile Menu opens as a modal and Escape closes it.
- PASS: final screenshots visually inspected, including the narrow business detail and offline merchant queue. Fixed the 360 px rating-control overflow found during this pass.
- UNKNOWN: real auth/recovery delivery, live socket events across devices, external map availability, and deployed runtime. No external account configuration was changed.

The browser fixtures intentionally leave realtime disconnected, so the final merchant screenshot also exercises the stale banner and disabled queue controls. Refresh obtains a confirmed snapshot; the product never labels a fixture as a real connection.

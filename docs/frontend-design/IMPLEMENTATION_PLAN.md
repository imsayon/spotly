# Spotly — implementation plan after design convergence

## Execution contract

**This plan is written after the design decisions. Do not reopen aesthetic exploration. Do not implement anything as part of the current design-only delivery.** A later implementation agent should follow the packages below in order.

Read README, DESIGN_DECISIONS, SCREEN_SPECIFICATION and the 17-page atlas first. Their division of authority is explicit in README. If source has drifted, reconcile the specific contract, not the entire design. If a runtime prerequisite is unavailable, report the exact validation gap; do not fake success or invent substitute product behavior.

The release is two related frontends, not a new backend platform. Preserve static export, current APIs except the two named supporting changes, role boundaries and existing share URLs. No new framework, UI library, auth provider, charts package, state library or database table is needed.

## 1. Delivery order and dependencies

```text
P00 Baseline and preservation
  -> P01 Tokens and real primitives
  -> P02 Shells and route compatibility
  -> P03 Auth lifecycle and optional consumer setup
  -> P04 Queue state correctness
  -> P05 Consumer discovery/detail/ticket
  -> P06 Merchant queue
  -> P07 Outlet setup and management
  -> P08 Service editing contract and service UI
  -> P09 Account, reviews and activity
  -> P10 Marketing pages
  -> P11 Isolated working interface collection
  -> P12 Visual/accessibility/release validation
```

These packages describe an execution sequence, not separate architecture layers. Reuse components from earlier packages. Keep API-dependent work together with its consumer. Do not spend a package creating speculative abstractions.

## 2. Work packages

### P00 — Capture the actual baseline

**Touch:** no product files initially.

1. Read applicable AGENTS.md. Run `git status --short`, inspect tracked diff and record the untracked preview files. Preserve unrelated edits.
2. Confirm package scripts and configured environments without printing secrets. Confirm actual Spotly ports; do not stop other projects on 3000/3001. Use unused 3100 and 3102 for temporary checks if available.
3. The earlier `design-preview` files are assistant-authored experiments, not the design source. Do not extend their monolithic component by default. Keep them intact until P11 replaces their function; then remove only superseded files in the reviewed scope.
4. Check whether the `next-env.d.ts` difference is only the previous dev-generated routes path. Restore that generated-only difference if no longer needed for the chosen build workflow; never reset the repository broadly.
5. Record baseline commands/results below. Existing failures must be distinguished from regressions.

**Checks:** workspace clean/dirty evidence recorded; no secrets exposed; each existing modified file has a preservation decision. **Done:** implementer can explain exactly which files were already changed before starting.

### P01 — Install the selected visual system in existing primitives

**Primary ownership:** `packages/ui/src`, each app's globals and root font declarations.

1. Introduce semantic role tokens from DESIGN_DECISIONS; keep palette literals centralized. Reuse existing shared CSS/theme structure rather than create a new token package.
2. Load IBM Plex Sans 400/500/600 and IBM Plex Serif 400 using existing Next font infrastructure. Serif is consumer display only. Remove redundant font loads after migration; no external runtime font CDN.
3. Update Button, Input, Badge and Toast to support selected variants, pending state, visible focus and labels. Preserve current API where reasonable; update all affected callers when changing a prop.
4. Create only missing dialog/empty/error primitives required by the specified screens. Prefer native dialog and inputs. Keep business rules out of primitives.
5. Replace old orb/glass/gradient styles on screens as they migrate. Do not remove shared assets still imported elsewhere until callers are migrated.
6. Remove ThemeToggle from final production surfaces and the root localStorage/system-theme boot script. Set the role theme deterministically at root. Do not simply hide the toggle while old dark rules remain active.

**Checks:** representative primary/secondary/destructive/disabled/focused buttons, input error, status and dialog in both themes. Verify contrast values and 44 px targets. **Done:** no migrated component depends on system color scheme or unreadable white-opacity text.

### P02 — Build role shells and preserve deep links

**Primary ownership:** consumer home/detail/queue layouts, merchant dashboard layout, compatible route pages.

1. Consumer shell wraps Discover, detail, tracker, Saved and Account. A layout component is sufficient; do not introduce route groups solely for aesthetic folder structure.
2. Consumer navigation is exactly Discover / Your turn / Saved / Account. Desktop top nav, compact bottom nav below 768 px. Public pages bypass auth-required rendering but retain auth context.
3. Merchant sidebar has exactly Queue / Outlets / Services / Activity / Settings at >=1100 px; smaller widths use labeled Menu drawer. Scope header lives outside the sidebar.
4. Implement canonical/alias routing exactly as SCREEN_SPECIFICATION. Use client `replace` in static alias pages with a visible fallback link. Preserve entryId, merchant id and outletId; validate destination parameters.
5. Search params that need client rendering live under appropriate Suspense boundaries for Next static builds.
6. Store selected owned outlet in URL plus in-memory state. Avoid hidden first-outlet selection in reviews, queue or services.

**Checks:** open every legacy and canonical URL directly, refresh it, use Back/Forward, try invalid IDs. Confirm only one consumer nav and no redirect cycle. **Done:** detail and tracker keep the shell, and old QR links still reach the intended entity.

### P03 — Complete authentication before testing the queue journey

**Primary ownership:** both auth stores/providers, auth routes, existing auth form presentation.

1. Add the six static auth routes from the spec and share form anatomy, not an invented generic auth engine.
2. Retain the configured browser Supabase client's `detectSessionInUrl: true`. Remove duplicate manual hash parsing/setSession paths that compete with it. One provider owns resolved auth state and subscriptions. Handle recovery before ordinary redirects.
3. Implement safe returnTo allowlisting and sessionStorage fallback; no tokens in storage created for intent. Preserve selected outlet across Google/email flows. No automatic join/save after return.
4. Fetch backend identity before selecting role destination. Register only after confirmed missing profile; network/authorization/server failures get explicit Retry. Do not swallow errors or overwrite existing role.
5. Wire real signup verification/resend, reset request and recovered-password update using existing SDK. Retain email/draft after errors. Do not enforce an 8-character minimum on sign-in, which could block older valid credentials.
6. Replace blocking consumer profile completion with optional Account guidance. Do not require phone, location or GPS to browse/request.
7. Keep old root callbacks functional. Update redirect configuration only through the project's authorized deployment/configuration workflow; preserve legacy URLs. Record actual origin values in environment documentation, never derive one app's URL by changing ports.
8. Expose role mismatch with correct-app link and sign-out. Do not invent multi-role accounts.

**Checks:** anonymous public browsing; email signup with/without returned session; invalid credentials; Google callback; expired/reset links; recovery session; role mismatch; backend unavailable; malicious returnTo; sign-out failure. **Done:** neither callback loops nor silent registration failures can strand the user, and a pending intended request remains explicit after login.

### P04 — Fix queue data interpretation once

**Primary ownership:** existing queue feature stores, socket integration and small shared derivations if truly reused.

1. Identify re-export stores versus real implementations; change the implementation, not both copies blindly.
2. Preserve last successful snapshot on errors; separate loading/error/freshness from empty arrays.
3. Keep entry UUID separate from display tokenNumber. All list keys/mutations use UUID; display pads tokenNumber to at least three digits.
4. Derive pending count, WAITING count, CALLED entry and own waiting-ahead from the same status definitions and server order. No token subtraction or length×5 ETA.
5. Scope socket and late HTTP results to outlet. Disconnect old subscriptions on change/unmount. After own entry disappears from active snapshot, fetch owned entry to resolve terminal status.
6. Refetch after mutation acknowledgment/conflict. Do not simulate accepted/called/terminal state optimistically. Do not auto-call after marking served.
7. Add explicit fresh/stale UI state, last successful refresh time and manual retry. Retain existing polling fallback only if it exists and is working; otherwise use explicit Refresh rather than invent continuous polling infrastructure.
8. Make device alerts opt-in, deduplicated and subordinate to visible status. Suppress misleading background guarantees.

**Runnable logic check:** one focused test file using Node's built-in test/assert runner for pure derivations. Include duplicate token numbers across outlets/days, missing own entry, pending excluded from waiting, older pending acceptance changing order and stale snapshot retention. Test existing transition contracts in the server suite rather than creating a second production state machine.

**Done:** the same entry has the same meaning across HTTP, realtime, merchant and consumer surfaces.

### P05 — Build the consumer journey

**Primary ownership:** consumer landing-independent product pages/components.

1. Implement C02 list using public merchant catalog, stable filtering and real logo/initial fallback. No queue N+1 on the directory and no unverified distance labels.
2. Fold Explore into C03 map mode; preserve filters/selection in URL. Existing Leaflet provider and attribution stay. Missing map/geolocation must retain List.
3. Build C04 outlet-aware summary/detail once and reuse presentation on desktop summary/full page. Load queue/menu/reviews only for selected outlet; errors are section-scoped.
4. Request flow is anonymous → sign-in → same outlet → explicit Request → pending ticket. Existing active entry points to its tracker.
5. Implement all C05 status screens and leave confirmation. Terminal results remain visible with owned entryId even after active becomes null.
6. Preserve real favorites, service information, directions and reviews links; do not reduce detail to a single CTA card.

**Checks:** guest search, map unavailable, multiple outlets, invalid outlet for business, no outlets, paused requests, active conflict, failed queue read, successful pending request, terminal entry, leave failure. **Done:** the full consumer path is usable at 360 px without relying on unavailable data.

### P06 — Build the merchant operating surface

**Primary ownership:** merchant canonical dashboard/queue presentation.

1. Replace duplicate overview/queue presentation with M03. Keep one underlying queue operation implementation.
2. Current band changes between Called / Ready to call / Nothing to call. It is the only primary Call next location.
3. Requests and Waiting are simultaneous wide; accessible counted tabs below 1100 px. Do not reset the selected tab on a new request.
4. Bind accept/reject/served/missed/advance to actual endpoints with outletId bodies where required. Add confirmation for destructive paths; keep remove-waiting in explicit row overflow.
5. Requests-enabled toggle maps actual outlet active state; pausing does not cancel entries or block serving existing customers.
6. Preserve focus when rows change; prevent a newly shifted row from receiving an unintended action after an acknowledgment.

**Checks:** fixture with 3 pending/4 waiting/1 called; accept; decline; serve; call; miss; remove waiting; no called; no waiting; paused joins; two-device conflict; stale controls. **Done:** operator can work without navigating to a second dashboard and cannot accidentally call two entries.

### P07 — Setup, outlets and safe sharing

**Primary ownership:** onboarding, outlets index/detail and existing outlet service deletion path.

1. Implement two-step saved onboarding as M02. Recover partial success by reading existing merchant/outlet before retrying. Do not post the merchant twice.
2. Stop creating zero-price menus during onboarding. Services remain optional afterward.
3. Implement outlet index/detail fields and map fallback exactly as M04/M05. Keep timezone read-only because current DTO does not save it.
4. Share URL includes merchant and outlet IDs and configured consumer origin. Copy fallback, QR display/download and correct deep-link destination must work.
5. Add deletion protection specified in SCREEN_SPECIFICATION: paused + no active entries, transaction-safe server check. Keep explicit cascade consequence in confirmation.
6. On deleting selected/last outlet, clear invalid scope and show the correct empty/create state.

**Tests:** add focused cases to existing server Node test suite for active-deletion conflict, foreign ownership and allowed paused deletion. Include real database race verification in release checks; a mocked unit test alone does not prove concurrency safety.

**Done:** first outlet can be created, shared and selected without stale links, duplicate records or active-customer deletion.

### P08 — Services including honest edits

**Primary ownership:** shared DTO for menu update, existing menu controller/service, merchant inventory page.

1. Add authenticated owner-checked `PATCH /menu/item/:id` for name/description/price exactly as specified. No schema/table migration.
2. Add request validation and service tests before wiring Edit. Do not implement edits by deleting and recreating an item.
3. Build M06 using existing category sections. Create, availability and delete retain current endpoints. Add service form is explicit, no speculative upload or cart.
4. Desktop rows and compact stacked action lines expose Edit/Delete without hover dependence. Draft cancel restores prior values; save failure retains draft.

**Checks:** zero price allowed; negative/nonfinite rejected; decimal formatting; blank name; ownership; edit success/failure; availability error; delete cancel/confirm; empty categories. **Done:** every visible service action persists accurately.

### P09 — Supporting account, reviews, activity and settings

**Primary ownership:** consumer favorites/profile; merchant analytics/business/settings/reviews.

1. C06 Saved opens the exact outlet and handles removal failure without losing it.
2. C07 Account preserves supported fields, optional profile setup, real recent visits, read-only identity email and working sign-out.
3. M07 Activity derives only the created-today cohort; chart bins use outlet timezone and count all returned statuses. Build accessible table alongside the simple chart with SVG/CSS, not a chart-library dependency.
4. M08 Business preserves supported fields and real verified flag, removes fabricated ratings/upload affordances, and separates merchant-wide data from outlet settings.
5. M09 Reviews uses scoped outlet and distinct failure/empty states. Keep actual review creation/update in consumer detail; no verified-visit claims.
6. Remove primary links to unsupported settings; keep direct URLs truthful and navigable.

**Checks:** favorites across outlets of same business; 20-item history; midnight/timezone grouping; chart/table agreement; failed stats vs failed list; zero reviews; business save failure; long names/addresses. **Done:** supporting features match the chosen system and retain existing real functionality.

### P10 — Build the final marketing narrative

**Primary ownership:** two existing landing pages and metadata.

1. Implement C01 and M01 copy/order exactly. Consumer visual is the ticket progression; merchant visual is operating the sample queue.
2. Label demonstrations as examples. Their local transitions do not use real stores/API mutations.
3. Use the selected Plex typography and current brand assets. No generated storefront images representing real merchants, fake testimonials, ratings or invented public metrics.
4. Correct metadata claims such as “never wait again.” Link only actual legal/support destinations already configured; do not invent them.
5. Demo works with buttons and reduced motion. No scroll hijacking, automatic background audio or cinematic load dependency.

**Checks:** first viewport clarity at 360/1440; guest CTA; configured cross-app link; reduced-motion demo; no outgoing mutation when demo is operated. **Done:** landing explains the actual product within the first viewport and does not misrepresent capability.

### P11 — Deliver the requested working interface collection

This is later implementation work, not part of the current static design delivery.

1. Replace the old experimental preview with thin development-only collection routes in the existing apps. Reuse the final screen components with explicit sample props/adapters; do not fork an entire alternate UI tree.
2. Ensure preview routes bypass real auth registration, global onboarding and live socket/network mutations. A label alone is not isolation.
3. Supply deterministic outlet-scoped fixtures: main outlet has token 041 called, 042–045 waiting, 046–048 pending. Customer 045 belongs to main outlet. Use stable UUIDs separate from tokens. Second outlet has different IDs/data and can reuse token numbers to test scoping.
4. Add controls for role/screen/state/reset only in the preview toolbar, never production navigation. Include guest, active/terminal queue, empty/error/loading/offline, invalid form and permission-limited states.
5. Local actions honor paused requests, one active customer, one called entry and server ordering. Device/real auth actions show clearly simulated screens without transmitting credentials.
6. Reset restores all sample state including outlet, saved records, drafts and queue. State transitions remain consistent when switching role.
7. Verify production static output does not expose a functional sample mutation UI. Development-only route may be omitted or render notFound, with no preview entry in production navigation.
8. Remove superseded assistant preview files only after the replacement covers their purpose and passes tests. Preserve user's unrelated work.

**Done:** the collection is genuinely operable and uses the actual final UI; it cannot change live customer data.

### P12 — Verify and hand off, without automatic deployment

1. Run checks below on the final code, not only an earlier partial state.
2. Capture consumer and merchant screens at 360, 390, 768, 1024 and 1440 px. Compare hierarchy, type scale, actions and states with atlas/spec. Do not demand literal PDF pixel equality because board frames are scaled presentations.
3. Test keyboard traversal, dialogs, focus return, mobile nav clearance, 200% zoom, reduced motion and screen-reader status announcements. Run automated accessibility tooling if available, then inspect manually.
4. Validate real auth/queue flow with designated test identities/outlets. Do not use ordinary customer entries. Do not claim live PASS from fixture-only tests.
5. Review diff for accidental backend changes, credentials, unreachable components, duplicate auth handlers and legacy theme styles.
6. Document Saved / Tested / Committed / Deployed separately. Deployment, pushes and account configuration changes follow the user's authorization; do not infer them from this design handoff.

**Done:** no critical failure is hidden by a polished screenshot, and every remaining UNKNOWN is explicit.

## 3. Exact validation commands and limits

Run from repository root using the pinned package manager. The dedicated frontend typecheck configs already exist:

```bash
pnpm --filter @spotly/consumer exec tsc -p tsconfig.typecheck.json --noEmit
pnpm --filter @spotly/merchant exec tsc -p tsconfig.typecheck.json --noEmit
pnpm --filter @spotly/types build
pnpm --filter @spotly/database build
pnpm --filter @spotly/server test
pnpm --filter @spotly/consumer build
pnpm --filter @spotly/merchant build
```

Run relevant focused checks after each package; run the complete sequence at final integration. Do not repeatedly run unchanged full builds to simulate progress. If generated types or environment prerequisites prevent a check, name the command and exact failure. Never patch unrelated infrastructure just to obtain a green report.

New pure frontend logic tests use Node's built-in test runner, following the existing minimal test approach. Browser testing may use the available browser automation/runtime without adding a dependency to production. Static export is tested by serving `out` through a static file server; `next start` is not the validation method for an exported site.

## 4. Required acceptance matrix

| Scenario | Expected result |
|---|---|
| Anonymous opens Discover | Real directory renders; no auth/profile wall |
| Guest selects outlet and signs in | Same outlet restored; request still requires click |
| Guest opens Saved | Sign-in invitation, not fake empty data |
| Two outlets share token 045 | No cross-outlet selection or alert |
| Pending request | Explicitly unconfirmed; excluded from waiting count |
| Older pending is accepted | Server order preserved; ahead count may increase |
| Current call exists | Call next unavailable; serving does not auto-call |
| Mark served acknowledged | Terminal state retained; next call becomes available |
| Entry disappears from active snapshot | Owned entry fetched before terminal display |
| Request expires | Server-derived MISSED, neutral Request ended text |
| HTTP or socket failure | Stale data identified, never replaced by false zero |
| Mutation response is uncertain | Refresh/reconcile; no automatic repeated destructive action |
| Switch outlet during fetch | Late old response cannot overwrite new scope |
| Consumer session expires | No cancellation; sign-in continuation returns to entry |
| Recovery link arrives | Recovery screen before dashboard redirect |
| Backend identity read fails | Retry; no blind re-registration/role overwrite |
| Favorite opens merchant with multiple outlets | Original saved outlet selected |
| Map unavailable or permission denied | Directory remains usable |
| No reviews | “No reviews yet”; no fake rating |
| Review failure | Error/Retry, not zero reviews |
| Activity at midnight | Correct outlet-local created-today cohort |
| Partial onboarding failure | Existing business reused; only failed outlet step retried |
| Requests paused | New request prevented; current queue can be served |
| Delete outlet with active entry | Server conflict, outlet remains intact |
| Edit service name/price | Actual owner-checked update, not local toast-only success |
| Long labels / 200% zoom | Reflow without clipped actions or horizontal page scroll |
| Keyboard-only use | All actions reachable; dialogs trap and return focus correctly |
| Reduced motion | All information and actions work without animation |
| Preview interaction | No live auth registration, socket mutation or credential transmission |
| Production export | No exposed functional preview collection; old deep links remain usable |

## 5. Priority and stop rules

**P0 — structural correctness:** shell continuity, auth intent, role identity, queue semantics, outlet scope, stale/error handling and real operation parity. A release cannot compensate for these with marketing polish.

**P1 — complete experience:** supporting forms, reviews, services, onboarding, map mode, landing narratives, fixed themes and responsive coverage.

**P2 — polish within this design:** row update tint, deliberate loading shapes, improved focus/empty states, spacing and font consistency. Do after correct behavior, not instead of it.

**Deferred, not secretly part of implementation:** ETA prediction, “I'm here”, appointments, staff permissions, multiday analytics, background push guarantees, billing, payments, review moderation, image upload, command palette, queue reordering, multi-role account conversion and theme switching. Add only under a separate product request with data/API support.

Stop the package and report a concrete blocker if existing contracts cannot produce the specified behavior. Do not silently replace real functionality with sample data, expand into a new platform, or ask the user to choose colors/layouts again. Design decisions are resolved; implementation facts may still require verification.

## 6. Final release report template

- **Saved:** exact files and package completed.
- **Behavior:** actual user-visible changes, including supporting API changes.
- **PASS:** commands and real scenarios verified, with screenshots where relevant.
- **FAIL:** failures and their practical effect.
- **UNKNOWN:** external prerequisites not verified; distinguish mock from live evidence.
- **Committed / pushed / deployed:** report each independently, never implied.

The implementation is complete only when real screens and the isolated collection agree with the design, all preserved operations work, and critical checks pass. A typecheck, mockup, or locally simulated queue alone is not completion.

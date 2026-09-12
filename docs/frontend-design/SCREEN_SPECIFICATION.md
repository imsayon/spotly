# Spotly — screen and interaction specification

This document is the behavioral authority for the selected design. Use the atlas for composition and DESIGN_DECISIONS for tokens. All screens inherit the common states and responsive rules below; the per-screen entries add exceptions. No implementer is expected to choose a design direction.

## 1. Route and navigation map

Keep Next static export and query-string IDs. Do not introduce server-only route handlers, middleware redirects, unknown dynamic export paths or a new hosting requirement.

| Audience | Destination and canonical URL | Treatment of current routes |
|---|---|---|
| Consumer public | Landing `/` | Same URL, new narrative |
| Consumer public | Discover `/home` | Merge richer Explore functionality here |
| Consumer public | Map mode `/home?view=map` | `/home/explore` replaces to this URL; preserve supported search/selection query values |
| Consumer public | Place `/merchant?id=M&outletId=O` | `id` remains merchant ID; optional outletId preselects an owned outlet |
| Consumer signed-in | Your turn `/home/queue?entryId=E` | `/queue?entryId=E` replaces to canonical; no redirect loop |
| Consumer signed-in | Saved `/home/favorites` | Label Saved, preserve outlet on open |
| Consumer signed-in | Account `/home/profile` | Profile, recent visits, sign-out |
| Both, separate apps | `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth/reset`, `/auth/update-password`, `/auth/callback` | Explicit static pages; retire visual modal as primary auth entry |
| Consumer signed-in | Optional profile setup | Inline Account prompt; no mandatory full-screen onboarding |
| Merchant | Landing `/` | Same URL; business-specific narrative |
| Merchant signed-in | Setup `/onboarding` | Two saved stages: business, first outlet |
| Merchant owner | Queue `/dashboard` | `/dashboard/queue` replaces here, retaining outletId |
| Merchant owner | Outlets `/dashboard/outlets` | Same URL |
| Merchant owner | Outlet detail `/dashboard/outlets/detail?id=O` | Same URL; settings/location/sharing, links to scoped queue/services |
| Merchant owner | Services `/dashboard/inventory?outletId=O` | Label Services; keep URL for compatibility |
| Merchant owner | Activity `/dashboard/analytics?outletId=O` | Label Activity; created-today history, no multiday controls |
| Merchant owner | Settings `/dashboard/settings` | Business, Sharing, Reviews, Account links |
| Merchant owner | Business `/dashboard/business` | Keep existing functional page, accessed through Settings |
| Merchant owner | Reviews `/dashboard/settings/reviews?outletId=O` | Preserve page; use selected outlet, not first outlet |
| Merchant owner | Unsupported settings routes | Existing billing/payments/subscription/notifications/security pages remain truthful unavailable screens; remove their promotional/nav tiles |

Consumer desktop navigation: Discover, Your turn, Saved, Account. Same four labels and order in mobile bottom navigation. The active destination has both color and underline/background change plus `aria-current`. Guests can enter Saved/Your turn/Account but see an inline sign-in invitation, not a fake empty account. Public Discover and Place remain usable. Desktop auth has only brand, back link and optional role-context explanation, not an authenticated-app sidebar.

Merchant primary navigation: Queue, Outlets, Services, Activity, Settings. Global context header contains business name, selected outlet and requests-enabled control on outlet-scoped pages. Business settings are merchant-wide and say so. No Overview plus Queue duplication. No Reviews primary destination; it is within Settings. Merchant compact Menu is a dialog/drawer with these five links, outlet switcher, close and sign-out.

Selected outlet precedence: valid URL outletId → last valid in-memory outlet → first returned owned outlet. No owned outlets goes to the create-outlet empty state. When the requested outlet does not belong to the merchant, show unavailable/permission feedback, never silently edit another outlet. Switching outlet updates URL, unsubscribes the old room and clears pending per-outlet actions. Do not copy queue contents across outlets.

## 2. Shared state grammar

### Fetching and connection

- First load: retain navigation/header; render geometry-matched skeletons, one accessible loading message. Never briefly show zero counts before a fetch finishes.
- Empty: only after a successful empty result. Show the screen's specific explanation and one relevant next action. Fetch failure is never “nothing here”.
- Refetch: preserve last successful data. Add “Updating…” beside section context without covering the page.
- Offline/failure with cached data: show persistent “Updates are paused. Last updated [time].” Queue mutations stay unavailable until a fresh read succeeds. Keep browsing, navigation and user drafts usable. Provide Refresh.
- Read failure without cached data: clear explanation, Retry, and appropriate navigation away. Do not render a blank page or fabricate records.
- Session expired: preserve entry/outlet identity and return destination. Show “Sign in to continue. Your place has not been cancelled.” No automatic leave mutation.
- Forbidden: “You don’t have access to this page.” Back to the appropriate workspace; do not expose foreign entry details.
- Not found: “This [place/outlet/request] is no longer available.” Offer Discover or Outlets. Do not report it as a network failure.

### Mutations

- Disable the submitting control and conflicting controls, retaining its label with a compact progress indicator. Do not disable unrelated navigation or draft fields unnecessarily.
- Queue mutations are pessimistic. Render acknowledged server state; do not optimistically remove a customer or call the next one.
- After success, show the visible result and optionally a polite toast. On failure, keep the row/form and draft; show inline error. If conflict is possible, refresh relevant queue/entry and explain the newer state.
- No mutation on hover, selection, navigation, callback completion or form-field blur.
- Confirm Leave queue, Decline, Mark missed, Delete service and Delete outlet. No confirmation for Accept, Mark served or Call next; disable duplicate submissions and show token-specific accessible names.
- Modal default focus goes to the heading or safe cancel action, never the destructive button. Escape/cancel closes it. Return focus to trigger; if the row disappears, focus its section heading. Dialog text names the affected token/outlet/service.
- Forms validate on submit and then on correcting invalid fields. Error summary links to fields; field messages use `aria-describedby`. Preserve typed values after errors. Requiredness comes from this spec and existing DTOs, not invented business policy.

### Responsive and accessibility defaults

Use the breakpoint/grid rules in DESIGN_DECISIONS. Single-column forms on mobile; no form field below 240 px in a side-by-side desktop group. Reflow at 200% zoom. No horizontal scroll except a genuinely tabular activity table, which also has a stacked mobile representation. Menus/dialogs fit `100dvh`, allow internal scrolling, and avoid covering the focused field with sticky actions.

Native buttons, links, input labels, radio groups and tables. Use a list for queue rows with action buttons; do not claim it is a sortable data table. Focus does not jump on socket updates. Announce the user's state change once; do not announce every other customer's row. Inputs retain native autocomplete, email/tel/number keyboard types and password-manager compatibility.

## 3. Consumer screens

### C01 — Landing

**Goal:** explain Spotly and start discovery without login. Atlas 07.

Order: compact wordmark/navigation → split hero → request/accepted/called explanation → real directory entry point → three questions → final CTA/footer.

Hero left: “Your place in line. A clearer kind of day.” Body: “Find a local business, request a spot, and follow your turn.” Primary Find a place links `/home`. Secondary For businesses links the configured merchant origin. Right: sample Corner House token and a three-step manually controlled demonstration. Steps say Request sent / Place confirmed / Your turn. Each click advances only local demonstration state; finish offers Replay. Label “Example journey · Sample data” throughout. No autoplay, live-data pretense or real queue mutations.

Below: three concise explanations and a Find a place CTA, not fake testimonials. FAQ: “Is my place confirmed immediately?” → only after acceptance; “Will I get an exact wait time?” → not currently; “How do I follow my turn?” → keep queue page open, reconnect if updates pause. Footer includes real existing legal links only, and the other app link. No fabricated social links or placeholder support email.

Mobile: copy, CTA, then sample ticket; explanation stacks. The first viewport must include what Spotly does and the Find a place action. No sticky marketing header on small screens. Auth/profile loading never prevents the public landing from rendering.

### C02 — Discover, List

**Goal:** choose a business; no personal data required. Atlas 03.

Order: shell → “Good places, close to your day.” → search → categories + List/Map switch → result count → business list and selected detail on wide screens.

Fetch public `GET /merchant`. Search matches returned name/category/address case-insensitively. Use categories derived from returned data plus All, not a fixed list that omits actual categories. No “nearby” wording, fabricated kilometer labels or sorting by distance because list coordinates identify a business and do not establish all outlet locations. Keep original server order, stable across local filtering. Empty result offers Clear filters.

Each row: real logo or initial fallback; category; business name; address if present else “Address available in details”; View place link. Do not fetch one queue per directory row. Do not show wait counts, rating or physical-open claims in the base directory. “Requests enabled at an outlet” may appear only from returned isActive information, but omit it when it adds ambiguity across multiple outlets.

At >=1100 px, selecting a row sets `merchantId` in discovery query state and loads the same place-summary component used by C04 into a 384 px panel. Initial state has no forced selection: panel says “Choose a place to see its outlets.” On smaller screens selection navigates to C04. A real “Open full details” link remains on desktop summary. Search/filter selection persists in URL so Back restores it; do not erase filters when closing detail.

Panel: selected business → outlet selector if multiple → outlet address → queue count/status after successful load → Request a spot → acceptance explanation. Primary action is at outlet level. No hidden default request for the first outlet. Default selector can display the first outlet, but requesting always shows its name and address.

### C03 — Discover, Map

**Goal:** spatial alternative using existing public coordinates. Atlas 14.

Same search/filter state and selected business as List. Use current Leaflet provider and attribution. Plot businesses with valid numeric lat/lng. Missing coordinates do not remove a business from List; show “Some places are available in List only.” No artificial marker positions, ETA bubbles or automatic location permission request.

Initial bounds fit available results; if none have coordinates, show map unavailable with Switch to List. “Use my location” is explicitly user-triggered; on denial, explain and keep the directory. This centers the map only; do not claim the backend performed a nearby query. Panning never silently filters results. No radius slider or automatic nearest sort in this release.

Marker selection opens business summary. On mobile, a compact nonmodal summary beneath the map offers View place, which navigates to C04. Keyboard users can switch to the equivalent list. Map failure retains the list switch and selection. Switching modes does not fetch a separate catalog or lose search.

### C04 — Business/outlet details

**Goal:** make an informed, outlet-specific request. Atlas 09.

Read merchant by id and outlets by merchant. Optional outletId must match that merchant; invalid selection shows a message and the selector rather than silently requesting elsewhere. No outlets: “This business hasn’t added a location yet.”

Order: back to Discover → business identity/category/description → outlet selector → address and published hours → request status and accepted waiting/called counts → request button and acceptance explanation → services/menu → reviews → contact/directions and save outlet.

`isActive` display: Requests enabled / Requests paused. Published hours are informational and labeled with outlet timezone; do not claim join is schedule-enforced. Service prices use INR formatting for this release; services are informational, not a booking cart. No service selection affects the queue request, whose payload is only outletId.

Request enabled if fresh outlet data, requests enabled, auth resolved and no in-flight submission. Guest click navigates to sign-in with a safe return URL; after auth, return to this outlet but do NOT auto-submit. Existing active entry: replace request action with View your turn and explain one active place at a time. No current entry: POST join, then navigate to C05 using returned entry UUID.

Queue count: number of WAITING entries; CALLED shown separately as 0 or 1. Pending requests are excluded from waiting. Failed queue read says “Queue information unavailable”; never 0. A fresh authoritative join may still reject due to race; show reason and refresh.

Favorites: POST/DELETE favorite using outlet ID. Guest Save follows auth continuation without auto-saving. Directions: external maps URL built from outlet coordinates, else encoded address; if neither exists, omit action and state address unavailable. No live-location dependency. Website link only if valid http/https; phone link only if supplied.

Reviews: real average and count, list in returned order. 0 reviews → “No reviews yet”, not 0-star quality score. Show supplied author name or “Customer”; do not mark verified visit. Signed-in customer may add/update their outlet review through existing POST /review; one review per user/outlet is upserted. Editor: labeled 1–5 radio group, optional comment, Submit review. No merchant reply, moderation, image uploads or delete action without an API.

### C05 — Your turn

**Goal:** understand the exact current state and next action. Atlas 04 and 12.

No entryId: fetch `/queue/active`. With entryId: fetch owned `/queue/entry/:id`; if terminal, keep that state visible rather than redirecting to an empty screen. Entry identity is UUID; display number comes from tokenNumber. Always show outlet name/address, timestamp context and state text.

| Backend status | Headline / status | Information and actions |
|---|---|---|
| PENDING_ACCEPTANCE | “Request sent.” / “Awaiting acceptance” | Token; “Your place is not confirmed yet.” Ten-minute acceptance explanation; directions; Leave queue |
| WAITING | “Your place is confirmed.” / “Waiting” | Token; number of WAITING entries before this UUID in server order; separate called count; directions; Leave queue |
| CALLED | “They’re ready for you.” / “Your turn” | Token; “Please go to the counter.” Directions; Leave queue remains quiet; no “I’m here” control |
| SERVED | “Visit complete.” | Token and outlet; Find a place; optional Review this outlet linking C04 reviews |
| MISSED | “Request ended.” | “This request is no longer active. It may have expired or been ended by the business.” No invented specific reason; Find a place |
| CANCELLED | “You left the queue.” | Place cannot be restored; Find a place; no silent rejoin |

Waiting ahead uses array order by createdAt/id, never token subtraction. An older pending entry may be accepted ahead of a newer accepted entry; the position can increase. Do not promise a fixed place count or time. If the own entry is absent from active snapshot, re-fetch the owned entry; absence alone does not prove completion/cancellation.

While active, show “Keep this page open to follow updates.” Optional “Enable alerts on this device” explicitly requests browser permission, tests a sound only after that click, and says alerts depend on this page staying connected. If denied/unavailable, preserve visual updates and provide no repeated prompt. No guaranteed background push. Deduplicate alerts by entry ID plus transition, not token number alone.

Pending expiry is server authoritative. Show the ten-minute policy as text; after the estimated deadline, refresh rather than locally assigning MISSED. No ticking countdown. Leave opens token/outlet-specific confirmation; on success render CANCELLED even though `/active` becomes null. Session expiration does not cancel the entry.

Desktop tracker max-width 560 px within consumer shell; mobile full available width. Status, number and next instruction precede directions/help. Quiet Leave action below them. No fake circular progress percentage or dashboard statistics.

### C06 — Saved

**Goal:** return to a specific outlet. Atlas 09.

Read `/favorite`. Rows: business name, outlet name, address, View outlet, Remove. Route includes both merchant ID and outlet ID. No queue-count fan-out. Requests-enabled label can use the returned outlet field. Removing is reversible through Save on detail; no modal needed, show resulting list and toast. On failure retain row. Empty: “No saved places yet. Save an outlet to find it here.” CTA Discover places. Guest: Sign in to see saved places.

### C07 — Account and recent visits

**Goal:** manage supported personal details. Atlas 09.

Order: name/avatar initial → editable name, optional phone, optional secondary phone, optional area → Save → recent visits (up to the existing endpoint's 20) → password reset entry → Sign out. Email is identity information, read-only here; do not patch a backend email and imply Supabase login changed. Preserve optional stored lat/lng through the existing location picker, but never require GPS.

Blank optional fields are allowed; do not submit blank name to a min(1) DTO. No invented SMS verification action: only display phone verification if true from data. No delete-account or billing controls. Recent visits use `/queue/history`, keep returned order, token, outlet, creation date and status; link to owned entry tracker and reviews. Failed history fetch shows its own Retry while the profile form stays available.

First sign-in: no forced onboarding overlay for missing phone/location. Show a dismissible invitation to complete Account; public discovery and requesting remain possible because queue API does not require those fields. User edits initialize when profile resolves, but later refetches must not overwrite dirty fields. Sign-out must honor SDK failure; do not claim signed out if it failed.

## 4. Merchant screens

### M01 — Merchant landing

**Goal:** explain operational value and start setup. Atlas 15.

Header: Spotly for business, How it works anchor, Sign in. Hero: “A calmer front desk.” Body: “Accept requests. Call the next customer. Keep every visit clear.” Primary Set up your business → sign-up; secondary existing sign-in. Right: labeled sample current-call/request panel. Demonstration steps: accept request → finish current call → call next; no real operations.

Below: business → first outlet → share link → first request illustrated as a single sequence; one linked consumer-ticket example; concise FAQ about acceptance, customer updates and multiple outlets; final CTA/footer. No fake metrics, staffing, billing or enterprise claims. Mobile copy/CTA comes before demo, with no offscreen mandatory step.

### M02 — Onboarding

**Goal:** persist the minimum usable business and outlet. Atlas 16.

Step 1 “Your business”: name required, category required, description optional. POST merchant once. Existing merchant goes directly to step 2; do not replay create on a failed later step. Step 2 “Your first outlet”: name required, address required by this UI (backend optional), optional map pin; published opening/closing times under an optional Hours section. Create outlet, then navigate to Queue. Current API timezone default remains Asia/Kolkata; display that fact rather than expose a timezone selector the DTO cannot save.

Show saved progress based on fetched merchant/outlets. No invented total onboarding percentage. If business creation succeeds but outlet fails, retain business and retry only outlet. In a partial setup, Back allows editing existing business instead of creating a duplicate. Do not create zero-price services in the background. After outlet creation, show “Add services” and “Copy outlet link” as optional next actions in the empty queue, not additional blocking setup steps.

Optional marketing/legal fields (GST, founding year, website) live in Business settings. No default claim of verification. Account role mismatch must be resolved by navigation, not by converting the role in onboarding.

### M03 — Queue workspace

**Goal:** operate the current outlet. Atlas 05–06.

Order: context header → page title and connection state → current called band → New requests / Waiting lists → small relevant empty-state guidance. No KPI row above the working queue.

Current band with CALLED entry: token, “Called to the counter”, explanation, Mark served primary, Mark missed quiet secondary. No CALLED entry with WAITING: “Ready for the next customer”, first waiting token, Call next primary. Neither: “No customer to call yet”, disabled Call next with explanation. Maintain the band height across these states to avoid shifting rows.

Wide screens show lists side-by-side. Compact screens use Requests and Waiting tabs with counts; default Requests if nonempty else Waiting. Counts remain visible; user-chosen tab is not auto-switched on arrivals. New requests sorted by server order, oldest first. Each row: token, requested time, Accept, Decline. Waiting rows: token, time since creation, “Next” on first; overflow action “Remove from queue” maps existing reject capability for WAITING and requires confirmation. Do not offer drag reorder, bulk accept or arbitrary call.

Mark served does not auto-call. After acknowledgment the band changes to Call next. Call next uses advance endpoint, never a client-chosen token. If another device called someone, refresh and display that called token. A rejected/expired request should not vanish until confirmed by the server; after removal keep focus on section or next appropriate control.

Use relative minutes only as descriptive text; on hover/focus disclose full timestamp in outlet timezone. Every action's accessible name includes token. Queue socket data must be scoped to outlet; protect against late requests resolving after selection changes. Never show public customer names absent from the queue response.

Requests toggle in header: explicit switch “Requests enabled”. Disabling asks a confirmation explaining existing entries remain active; enabling is direct. PATCH the existing outlet active operation; show success only after acknowledgment. Pausing does not prevent serving/calling existing entries because the server's active toggle gates joining, not advance. Published hours are not an automatic queue schedule.

### M04 — Outlets

**Goal:** select or create an outlet. Atlas 10.

Rows/tiles are discrete locations, so bounded surfaces are appropriate here. Show outlet name, address, requests-enabled state, Open queue, Edit details. Do not fetch every queue just to decorate this index. Add outlet opens a native dialog/full-screen compact form using M02 outlet fields; after success show the actual returned outlet and offer Open queue. Empty: Add your first outlet. Errors keep the previous list.

Open queue links `/dashboard?outletId=O`. Edit details links existing detail URL. Never silently reset another outlet's queue state from a copied fixture.

### M05 — Outlet detail

**Goal:** maintain location and sharing settings.

Order: breadcrumb to Outlets → name and Open queue → Details form (name, address, map pin, opening/closing times) → requests-enabled control → sharing block → links to Services and Reviews scoped to this outlet → Danger section.

Use name required; address required in new/edit UI; optional coordinates with -90..90 latitude and -180..180 longitude. Hours use native time inputs and allow overnight published hours; label timezone as read-only current value. Do not infer closure logic from times. Map selection updates draft only. Manual address remains usable if geocoding fails. Save is explicit; cancel restores last successful data.

Sharing: construct configured consumer origin plus `/merchant?id=M&outletId=O`; encode IDs; render QR with installed qrcode package. Copy button reports clipboard error and exposes selectable URL fallback. Download/print QR use current outlet URL, not stale first outlet. Do not hardcode development ports.

Deletion: paused outlet and no active entries required. Confirmation names outlet and states linked queue history, menu and reviews may be removed by current cascading behavior. Server protection is required (see contracts); a disabled UI alone is insufficient. Successful deletion returns to Outlets and clears selected outlet; if it was the last, show create state. No invented archive/restore feature.

### M06 — Services

**Goal:** create and maintain the actual menu/service data. Atlas 10.

Keep inventory URL, label Services. Order: selected outlet → categories as section headings → rows (name, optional description, formatted INR price, availability, Edit, Delete) → Add service and Add category. Do not expose a shopping basket or paid appointment flow.

Add: category required (explicitly create General if none), name required, price required nonnegative, description optional. Keep existing fields/order in data; no drag reorder UI. Image URLs may render if already stored, but no unsupported upload button. Edit uses the specified new PATCH item contract, not delete/recreate. Availability uses existing boolean query endpoint and reverts on failure. Delete confirms service name; category delete/rename is not offered in v1 because no endpoint exists.

Compact rows stack details, then an explicit action line; no hover-only edit controls. Price input has min 0 and step .01; formatting is display only. Preserve unrounded numeric data unless changed by the user. Labels say INR; no currency selector exists in the model.

### M07 — Activity

**Goal:** explain the available daily request history accurately. Atlas 11.

Read authenticated `/queue/outlet/:id/history`. This is the cohort of entries created since that outlet's local midnight, including active entries. Title “Today's requests”; subtitle outlet date/timezone. Four stats: Created today (row count), Served (SERVED), Not completed (MISSED+CANCELLED), Still active (pending+waiting+called within this cohort).

Chart: requests by creation hour, 24 bins 00–23 in outlet timezone, direct axis label and accessible table. Every returned entry is counted, regardless of status. A small sample has no smoothing or trend arrow. Below: activity list token/status/created/called/served times, missing times as em dash. Status filter All/Served/Not completed/Active operates on this cohort; no date-range controls, percentage efficiency, “average wait” or week heatmap.

An entry created yesterday but still in the live queue is absent here. Explicit note: “Includes requests created today in this outlet's timezone.” Never force the activity active count to equal the live queue. Failure is Retry, not zero performance.

### M08 — Settings and business details

Settings landing is a simple grouped list: Business details → business page; Sharing → selected outlet detail sharing anchor; Reviews → selected outlet reviews; Account → email, password reset link, Sign out. No huge placeholder-card grid.

Business page preserves supported fields: name/category required, description/phone/contact email/website/address optional, founding year integer optional, GST optional, existing logo display. Distinguish business-wide address from outlet location. Keep map picker if editing business coordinates; do not overwrite outlet coordinates. Use existing DTO validation; website must be valid URL. No image-upload button until a real upload flow exists. No fabricated 4.8 rating, “New Partner”, “Active” or pending-verification badge. Verified badge only when verified true.

Group business/contact/additional fields with section dividers, not nested cards. Save button belongs to the form. On fetch/refetch do not overwrite unsaved edits. Account email is read-only identity; reset follows auth flow. Existing unsupported settings URLs show plain “This feature is not available yet” and Back to settings, without fake controls.

### M09 — Reviews

Read selected outlet's stats and reviews, not merchant's first outlet. Header outlet selector → real average/count → five horizontal distribution rows (same jade hue, numeric counts) → newest-first reviews with supplied names, dates and comments. Empty: “No reviews yet.” Error: “Reviews couldn't be loaded” with Retry; retain successful stats if only list fails, label affected section. No reply/delete/moderate button without API. Small-screen distribution remains text readable, not a donut.

## 5. Authentication lifecycle in both apps

Atlas 08 and 17. Shared form anatomy; role colors and introductory copy differ. Do not replace Supabase or build custom token validation.

| Screen | Fields and behavior | Completion/failure |
|---|---|---|
| Sign in | Google option; Email; Password with show/hide; Forgot password; Sign in; signup link; back to intent | SDK signInWithPassword/OAuth; then backend identity; safe return route |
| Sign up | Google; optional name; email; password; Create account; sign-in link | Session present → identity resolution; no session → verification screen |
| Verify | “Check your email”; explain confirmation; resend; change email/back | Resend only after user click; respect provider errors/rate limits; no fabricated sent success |
| Reset | Email; Send reset link; back to sign in | Neutral response regardless of account existence; provider transport errors shown |
| Update password | New password and confirmation; show/hide; Update | Valid recovered session required; invalid link offers new reset; do not route to normal dashboard before recovery completes |
| Callback | Branded progress, no form | Settle supported SDK callback once, fetch backend identity, route; show recoverable failure if missing/invalid session |
| Role mismatch | Explain account belongs to other workspace; open other configured app; sign out | No automatic mutation of stored role |

Use current Supabase SDK flow configuration; do not introduce SSR for these exported apps. Keep one owner for callback handling. If using explicit PKCE exchange, disable competing automatic exchange; do not attempt both. The selected implementation is to retain the existing browser client/session detection and handle auth-state completion once in the provider; the callback page renders its state. Legacy callbacks at `/` remain recognized so old email links do not break. Recovery event takes precedence over ordinary dashboard redirects.

Safe return destination: URL `returnTo` may be relative, same app, from the allowlisted product routes above; reject schemes, `//`, external origins and nested auth loops. Store non-secret intent in sessionStorage only as fallback during external OAuth. IDs are validated again when the destination loads. Return to intended place after auth but never automatically join/save/delete. Default consumer destination `/home`; merchant `/dashboard` or onboarding if profile/outlet missing.

Backend identity is authoritative for role. Fetch `/user/me`; register only on confirmed missing profile, not any network/500 error. If identity cannot be resolved, show Retry rather than register blindly or assume role. Existing code paths that swallow this distinction need repair as part of integration.

Use autocomplete email/current-password/new-password correctly. Signup/update-password minimum 8 characters in UI, and display stricter provider-policy errors if configured; sign-in must allow existing shorter passwords. Do not log passwords, callback tokens or session URLs. Password strength theater is not required. After callback, remove auth fragments/credentials from visible URL through the SDK flow/history replacement.

Operational prerequisites: existing origins plus new callback/update-password URLs must be configured in Supabase's redirect allowlist. Preserve required legacy redirect URLs. Email delivery and Google redirect behavior need real end-to-end tests. References: [Supabase passwords](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). These are release checks, not reasons to invent local fake success.

## 6. Component contracts

Build only these demonstrated components and reuse the existing primitives where appropriate. Domain components stay in their app unless genuinely shared.

| Component | Anatomy / behavior / states | Responsive rule |
|---|---|---|
| Action button | Text, optional icon; primary/secondary/quiet/destructive; pending retains width, disabled explains why nearby | 44 px minimum, 48 px main mobile forms |
| Form field | Persistent label, native input, hint, error; required text; describedBy | Full width compact; no placeholder-only label |
| Consumer navigation | Brand plus four destinations, selected semantic state | Bottom nav below 768; never duplicate desktop nav |
| Merchant navigation | Brand + five destinations; scope header separate | Sidebar >=1100; labeled Menu drawer otherwise |
| Queue row | Token, timestamp, appropriate actions; focus-stable updates | Wide ledger; compact action line, no horizontal clipping |
| Current call | Label, number, exact state, one main action, quiet exception action | Fixed composition; stacked compact |
| Queue ticket | Outlet identity, accent rule, token, state, instruction, secondary directions/exit | 560 max-width; full compact width |
| Place row | Real logo/fallback, category, title, address, link | Row grows for long names; meaningful image alt or decorative fallback |
| Place summary | Business and selected outlet, availability/count, request explanation | Sticky when it fits wide viewport; standalone detail on compact |
| Outlet selector | Native select initially; label and selected outlet | Full-width where needed, keyboard-native |
| Status text/tag | Semantic word + optional icon; no color-only meaning | Wrap, no truncated status |
| Dialog | Named heading, consequence, safe cancel, specific confirm | Max 480 px, compact inset 16 px; scroll for content |
| Toast/banner | Polite short success; persistent inline operational error | Avoid covering bottom nav; no focus steal |
| Empty state | Specific title, explanation, one next action | No oversized decorative illustration |
| Loading state | Static skeleton matching rows/fields, one status message | Same geometry as loaded view |
| Activity chart | 24 labeled hour bins, count axis, data table alternative | Readable horizontal plot; table available compact |
| Review editor | Rating radio group 1–5, optional comment, submit | No tiny star-only tap targets |
| Setup progress | “1 of 2”/“2 of 2”, saved-step state | No progress percentage or fake checklist |

No general card mega-component, command palette, generic chart framework, new upload service, reusable form engine, or theme configurator. Implementation can reuse existing Toast/Button/Input and replace their styles; do not retain legacy variants that create mixed role styling.

## 7. API and data changes: exact boundary

Reuse current response envelope and Zod patterns. All existing endpoints keep their URLs and ownership protections.

**Required supporting addition — edit service:** `PATCH /menu/item/:id`, authenticated owner. Body: optional `name` (trimmed nonempty), `description` (string, empty clears), `price` (finite nonnegative number). Require at least one recognized field; reject changing categoryId/ownership through this operation. Resolve item → category → outlet and assert owner. Return updated item through existing envelope. Keep availability on existing endpoint. Tests: owner success, foreign owner denied, nonexistent item, invalid/negative/nonfinite price, empty name/body. No schema migration needed.

**Required supporting protection — outlet deletion:** existing DELETE must require outlet paused and reject while any PENDING_ACCEPTANCE/WAITING/CALLED entry exists, with conflict response and user-readable explanation. Check and delete within the repository's existing transaction strategy to avoid a join/delete race. Preserve the documented cascade for terminal history/menu/reviews and make confirmation explicit. Do not invent archive semantics. UI refetches after conflict. No new endpoint or table required.

**No other required backend expansion.** Keep read-only timezone in forms until a separately scoped change supports editing it. Discovery uses existing business coordinates, not an invented proximity API. Menu edits and deletion safety are explicit supporting work, not work performed in this design pass.

**Frontend-only types/state:** distinguish idle/loading/ready/error and fresh/stale for data; model mutation pending separately; keep selected outlet ID and own entry ID. Use shared QueueStatus. Do not introduce a persistent client copy of the backend state machine. Display derivations: waitingCount, calledEntry, pendingCount, ownWaitingAhead and created-today chart bins are pure functions of verified data.

## 8. Realtime integration rules

1. Subscribe to selected outlet using existing socket transport; fetch fresh HTTP snapshot on mount/reconnect.
2. Apply snapshots only if their outlet matches current scope and request is still current. Unsubscribe old scope on change/unmount.
3. Keep own entry separately from public active snapshot. If removed from snapshot, fetch its owned endpoint to discover terminal state.
4. Treat token number as outlet/day-scoped presentation, never global identity. Deduplicate called alerts with entry identity/status and outlet context.
5. On disconnect show stale data; do not clear to zero. Disable queue mutations until a fresh snapshot succeeds. A working HTTP refresh can re-establish fresh state even if the socket remains unavailable; show “Live updates unavailable” and use the existing polling fallback if present, otherwise manual refresh. Do not promise live updates in fallback mode.
6. Reconcile after acknowledged mutations; server conflicts win. Do not auto-advance on serving, auto-accept pending entries, or locally expire requests.
7. No interval that reloads the entire route or repeatedly re-registers the user.

## 9. Visual coverage and residual limits

Atlas boards cover alternatives, type, discovery/list, map, ticket states, wide/narrow queue, both landing narratives, auth entry/lifecycle, consumer detail/saved/account, outlets/services, activity/settings, onboarding and shared error states. Remaining detailed form fields follow the explicit anatomy here; there is no new visual style to invent for them.

The atlas is static. It cannot prove keyboard semantics, live state correctness, mobile browser behavior, auth delivery or readability on every device. Those are mandatory implementation checks. Do not treat “FINAL” on a design board as “implemented”, “user approved”, or “production tested”.

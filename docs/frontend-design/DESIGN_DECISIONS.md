# Spotly — the resolved product and visual direction

## 1. Thesis

**A clear place in the day.** Spotly connects a person's intention to visit with a business's ability to receive them. The defining interaction is a request becoming an accepted place and then a call. The interface should make that relationship legible, reassuring and easy to operate.

“Premium” here means precise status, strong type, restrained surfaces and an absence of unnecessary decisions. It does not mean an elaborate developer-console aesthetic. Consumer screens carry the warmth of local places. Merchant screens carry the clarity of a well-organized front desk. Their shared type, spacing, controls and status vocabulary make them siblings; their navigation and information density differ.

The signature visual is a **stationary number with changing status beside a short vertical accent rule**. It appears in the consumer ticket, the merchant's current-call panel and a clearly labeled marketing demonstration. The number does not spin, count down or imply a time estimate. This is a product-derived identity, not an ornamental motif added to every panel.

## 2. Diagnosis: source facts and judgments

| Finding | Classification | Decision |
|---|---|---|
| Server distinguishes pending, waiting, called and terminal entries | Good foundation | Make those distinctions central to the UI |
| Server enforces active-entry and called-entry constraints | Good foundation | Keep authority on the server; show conflicts clearly |
| Both apps already use Next, React, shared UI, stores and Leaflet | Acceptable | Reuse architecture; do not introduce a new framework |
| Merchant overview and queue repeat operational concerns | Structurally weak | `/dashboard` becomes the queue workspace; old queue URL aliases it |
| Consumer detail/tracker lose the home shell | Structurally weak | Share the consumer shell across discovery, detail and tracker |
| Basic discovery and richer Explore split the same task | Redundant | One Discover destination; List / Map controls inside it |
| Root auth redirects and blocking profile completion interrupt intent | Structurally weak | Dedicated auth continuation; optional customer profile details |
| Many interior styles still use white opacity on dark surfaces | Visually weak | Replace with role tokens during migration, not global recoloring alone |
| Forecasts derived from queue length and sample ratings look factual | Incorrect trust signals | Remove unsupported claims; show measured fields only |
| Favorites refer to outlets, but navigation can discard outlet identity | Functional mismatch | Preserve merchant AND outlet IDs in links |
| History endpoint returns today's created entries, not a multiday analytics product | Document overclaim | Title the page “Today's requests”; label the cohort explicitly |
| Reviews endpoints and review UI exist | Real capability | Keep reviews; correct first-outlet assumptions |
| Some settings routes are ComingSoon placeholders | Incomplete capability | Omit primary links; retain honest direct-route explanation |
| Existing menu API supports create, availability and delete, but not name/price edit | Concrete capability gap | Specify a small edit endpoint; never fake saved edits |

Evidence anchors: `server/src/modules/queue/queue.service.ts`, queue/menu/review controllers, `packages/types/src/index.ts`, Prisma schema, consumer home/detail/tracker/favorites/profile, merchant dashboard/business/outlets/inventory/analytics/settings and auth stores. These are source-based findings, not assertions of a fresh end-to-end production audit.

## 3. Reference analysis and translation

Inspected 11 September 2026. Source summaries below are deliberately short; the Spotly decisions are my design judgments, not claims that a reference validates Spotly's usability.

| Reference and evidence | Useful principle | Spotly decision | Reject |
|---|---|---|---|
| [Linear redesign account](https://linear.app/now/how-we-redesigned-the-linear-ui), official process and interface illustrations | Navigation chrome, alignment and hierarchy should support the working content; test complete views and their states | A quiet merchant sidebar and stable current-service panel; judge full workflows rather than isolated cards | Copying issue-tracker terminology or exposing every alternate view |
| Databricks, supplied screenshot `123915` | Large confident sans-serif type, decisive accent, early product evidence | Test technical sans against warm editorial type; show Spotly's real task in the hero | Enterprise scale claims and irrelevant database diagrams |
| Stripe, supplied screenshots `123949`, `124005`, `124011` | Strong alignment and changing section rhythm; diagrams explain connections | Align status transitions across customer and merchant examples; use varied section scale on landing | Waves and network graphics without a Spotly-specific meaning |
| LangChain, supplied screenshots `123754`–`123843` | Lifecycle storytelling and continuity between marketing and authentication | Explain request → acceptance → call and retain identity in auth | Huge offscreen decorative diagrams, low-contrast footer copy, technical region selection |
| [Waitwhile queue-management page](https://waitwhile.com/solutions/queue-management-system/), marketing evidence | The visitor journey and staff workflow belong to one service system | Align the customer ticket with merchant actions | ETA prediction, messaging, appointment and staffing features that Spotly does not implement |
| [OpenTable public discovery](https://www.opentable.com/), public page content | Place and category are natural discovery entry points; reviews need context | Search by business/category/address; preserve real outlet reviews | Reservation times, party sizes or verified-visit claims absent from Spotly |
| [National Park Service trip planning](https://www.nps.gov/planyourvisit/index.htm), public non-SaaS reference | Organize around the visitor's task sequence; practical guidance earns trust | Short next-step copy on the ticket and onboarding; plain fallback instructions | Tourism imagery pretending to depict a local business |
| [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/), official component | Status belongs next to the task, expressed in text | Pending/confirmed/called words stay adjacent to token; setup steps record completion | Institutional visual styling or a checklist for a two-field task |
| [Clerk custom-flow guidance](https://clerk.com/docs/guides/development/custom-flows/overview), documentation | Custom presentation still requires complete lifecycle handling | Keep Supabase; explicitly specify verification, callback and recovery | Switching auth providers to obtain a visual style |
| [IBM Plex](https://github.com/IBM/plex), official family and OFL documentation | Related Sans and Serif families provide UI clarity and editorial expression | One coherent Plex family across roles, with Serif limited to consumer display | Adding a third font just to imply technical sophistication |

The references do not imply that Spotly has those companies' functionality, scale or research budget. Airbnb and other broad examples were considered as discovery references but did not add a stronger decision than the sources above; no additional visual claims depend on them.

## 4. Alternatives actually compared

See atlas boards 01–02 plus the earlier supplied/generated concepts. The comparisons are expert critique, not fabricated user studies.

### A. Neighbourhood editorial

Large editorial headings, place-led composition, warm surfaces, slower rhythm. Strong for consumer motivation and landing identity. Weaknesses: large photography assumes unavailable assets; a spacious merchant version pushes requests below the fold; service actions become secondary to branding.

**Keep:** consumer display typography, warm canvas and human copy. **Reject:** photographic dependence, large merchant hero headings and card-wrapped lists.

### B. Service instrument

Stable left navigation, compact top context, current-call band and ledger rows. Strongest for merchant operations. Weaknesses: used everywhere it makes discovery feel like administration; too much monospace appears technical without improving comprehension; metric cards compete with the next decision.

**Keep:** merchant layout, tabular numbers, simultaneous lists. **Reject:** consumer sidebar, monospace UI, decorative KPIs.

### C. Spatial discovery

Map-first canvas with selected-place panel. Strong when location drives the decision. Weaknesses: unavailable coordinates produce an empty experience; a business location can differ from its outlet; panning plus nested details increases navigation complexity; no advantage for queue operation.

**Keep:** alternate Map mode sharing selection with List. **Reject:** map as home, live-location prerequisite, wait-time map markers and spatial merchant layout.

### Final selection

Use A's consumer expression and B's merchant task structure, unified by Plex and common component geometry. C is contained inside Discover as an optional representation. This is not a mixture of three visual styles: the tokens, controls and selected-place anatomy remain the same.

The result beats the earlier dark “Swiss Instrument” direction for this product because Spotly is a local-service experience with a frequent public/mobile audience, not a technical telemetry product. The fixed light work surfaces provide readable states without requiring a separate mode. The forest merchant navigation retains depth without making the work surface dark.

## 5. Critique and revision record

**First revision, after earlier generated images:** remove invented names/party sizes, distinguish pending from accepted, preserve outlet identity, reduce the oversized cancellation action, reject background notification promises, and stop letting palette choices stand in for workflow design.

**Second revision, on the authored boards:** retain both lists on wide merchant screens; make compact tabs an explicit responsive tradeoff; move consumer counts out of unselected directory rows; add real reviews and account/history surfaces; expose service editing as a real API dependency; replace “open” with “requests enabled” where hours are not enforced; add onboarding, map and auth-lifecycle sheets so the result is not just two attractive dashboards.

During visual inspection, missing special-symbol glyphs in the merchant header were replaced in the drawings; final implementation uses Lucide icons rather than typed symbols. The narrow frames are labeled 360 px, not incorrectly described as 390 px. The atlas is a layout reference, not a font/icon asset source.

Rejected embellishments: glass cards, orb backgrounds, full-screen page fades, animated queue numbers, confetti, glowing status rings, auto-playing sound, hide-and-seek hover actions, command palettes for five destinations, and headline claims that waiting time is eliminated.

## 6. Locked typography

Use **IBM Plex Sans** 400, 500, 600 for UI in both apps. Use **IBM Plex Serif** 400 only for consumer landing headings, consumer page headlines and large selected-business headings. Merchant headings remain Sans. Use existing font-loading infrastructure (`next/font`) with these families; remove Montserrat/Inter from the final app font load once migration is complete. Preserve OFL notices if fonts are vendored. No third monospace family.

| Role | Desktop | Compact/mobile | Font/weight |
|---|---|---|---|
| Consumer landing H1 | 64/70 px, -1.6 px tracking | 40/46 px, -0.8 px | Serif 400 |
| Merchant landing H1 | 64/68 px, -1.8 px | 40/44 px, -0.8 px | Sans 500 |
| Product H1 | 36/44 px, -0.7 px | 28/35 px, -0.4 px | Consumer Serif / merchant Sans 500 |
| Section H2 | 22/30 px | 20/28 px | Sans 500 |
| Body | 16/24 px | 16/24 px | Sans 400 |
| Row/supporting text | 14/20 px | 14/20 px | Sans 400 |
| Field label | 14/20 px | 14/20 px | Sans 500 |
| Metadata | 12/18 px | 12/18 px | Sans 400 |
| Kicker | 11/16 px, 1.1 px tracking | 11/16 px | Sans 500; never essential instructions |
| Queue number | 88/96 px | 80/88 px | Sans 500, tabular lining figures |
| Merchant row token | 24/32 px | 22/30 px | Sans 500, tabular figures |

Long headings wrap; do not shrink below this scale to preserve a single line. Body measures 45–65 characters. Queue tokens render `tokenNumber`, padded to a minimum of three digits, never truncated if four or more digits. Backend UUID `id` is never a display token. No uppercase paragraph copy or all-bold tables.

## 7. Locked palette and semantics

| Token | Consumer | Merchant |
|---|---|---|
| canvas | `#FAF7F2` | `#F3F5EE` |
| surface | `#FFFDF9` | `#FCFDF9` |
| surface-subtle | `#EEE6DA` | `#E5ECE0` |
| text | `#282723` | `#153D35` |
| text-secondary | `#6A6259` | `#52685F` |
| accent / primary | `#B34C35` | `#176B60` |
| primary-hover | `#963C29` | `#12574E` |
| on-primary | `#FFFFFF` | `#FFFFFF` |
| separator | `#D8CFC2` | `#CDD7CA` |
| input-border | `#8A8175` | `#76877B` |
| nav-dark | Not used in product shell | `#102C28` |
| nav-text | normal text | `#C2D6CB` |
| nav-selected | warm subtle/accent | `#D1E6C8` / `#153D35` |

Shared semantics: success `#176B60` on `#E5F1E8`; warning `#775019` on `#F7EACD`; error/destructive `#8B2E2E` on `#FBE9E6`; information `#245B85` on `#E7F0F7`. Terminal neutral uses the role's secondary text. Destructive confirmation uses solid error with white; cancellation does not become the normal page primary action. Brand clay is not the generic error color.

Disabled: subtle surface, secondary text, dashed/no emphasis only where needed; retain readable text instead of blanket opacity. Focus: 3 px role accent with 3 px offset; use a light high-contrast ring on forest navigation. Borders that identify form controls use input-border, not the lighter decorative separator.

Calculated sRGB contrast: white/clay 5.25:1; white/jade 6.35:1; secondary/chalk 5.61:1; merchant secondary/canvas 5.45:1; nav text/forest 9.75:1; control borders/surfaces 3.77:1 and 3.72:1. Warning, error and information text/background pairs exceed 5.9:1. These verify chosen pairs, not the accessibility of unimplemented pages. WCAG guidance: [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [target minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Spotly deliberately uses 44 px primary touch targets, exceeding the 24 px AA minimum rule's baseline.

Charts: daily counts use one jade series, no gradients. Reviews distribution uses the same hue for each star bucket with direct labels; color does not encode moral judgment. Do not create an unused eight-color analytics palette.

## 8. Geometry, grid and density

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Use 20 px only as mobile outer padding.
- Consumer product max-width 1280 px; desktop outer padding 40 px; 768–1099 px 32 px; below 768 px 20 px. Marketing max-width 1280 px, section spacing 96 desktop / 56 mobile.
- Merchant sidebar 216 px at >=1100 px. Main gutter 32 px, maximum workspace width 1440 px. Header 72 px. Below 1100 px replace sidebar with a labeled Menu drawer and 64 px header.
- Consumer nav 72 px desktop. Below 768 px use 64 px bottom nav plus safe-area inset, and 64 px wordmark header. Content bottom padding includes nav + 24 px.
- Discovery desktop list/detail split: remaining width minus 384 px detail and 32 px gap. Selected panel is sticky below header only when its height fits the viewport; otherwise normal document flow. Below 1100 px show list and navigate to full detail, not a crushed two-column layout.
- Merchant wide queue: current panel spans width; below it requests/waiting 1:1 with 32 px gap. Below 1100 px use accessible Requests/Waiting tabs with counts; current panel remains above them. This tablet/mobile exception is deliberate.
- Queue rows minimum 72 px desktop / 80 px touch; allow growth for labels. Plain separators, not individually rounded cards. Never make each queue section independently scroll on desktop.
- Radius: controls 6 px, bounded surfaces/dialogs 8 px, status tags 4 px. Round chips only for compact category filters. No nested card geometry.
- Shadow only for floating popovers/dialogs: `0 12px 32px rgba(16,44,40,.14)`. Page sections use alignment, spacing and separators first.
- Buttons 44 px minimum; primary mobile form/request buttons 48 px. Inputs 48 px. Icons 18–20 px, navigation 20 px, empty state 32 px; Lucide stroke 1.75. Avoid emoji as product icons.
- The atlas omits some icons to keep it an exact text/layout study. Implement required controls using the specified icon family and accessible labels, not glyphs from the drawing.

## 9. Motion and attention

| Event | Rule |
|---|---|
| Hover/press | Color/border transition 120 ms ease-out; no scaling |
| Dialog | Opacity and 6 px translate, 160 ms ease-out; native modal semantics |
| Mobile menu | 180 ms ease-out; no elastic bounce |
| Queue update | Text updates immediately; changed row receives subtle tint for 600 ms; no reorder animation |
| Called state | Status text changes immediately with one announcement; no number animation |
| Save success | Result visible in-place; noncritical toast for 4 seconds |
| Error | Persistent inline message until resolved/dismissed; no timed disappearance |
| Skeleton | Static matching blocks; no endless shimmer |
| Marketing demo | User-operated steps, 180 ms crossfade; no autoplay |
| Route navigation | Immediate content transition; no whole-page fade |
| Reduced motion | Remove translation, highlight fade and crossfade; retain state changes |

New requests must not steal focus or move a control under a pointer. No one-letter destructive shortcuts. Keyboard users get ordinary tab navigation and explicit buttons. Do not build a command palette in this release.

## 10. Brand and content decisions

Retain the existing Spotly wordmark/logo asset; do not trace the generated S mark. Consumer headline: **“Your place in line. A clearer kind of day.”** Merchant headline: **“A calmer front desk.”** Body states the mechanics plainly. Do not promise “never wait again,” guaranteed time savings or effortless scale.

No dependency on commissioned photography. Use real supplied logo/media fields where present. Otherwise use a typographic initial or Lucide category icon on a restrained surface. Do not generate storefront photographs and present them as real businesses. The launch hero uses a labelled product demonstration, so imagery is not a launch blocker.

No customer logos, ratings, verification badges or testimonials without actual data. `verified: false` does not authorize a “verification pending” claim. Reviews are real but not labeled verified visits. Hours are displayed as published hours; `isActive` means requests enabled, not proof that the shop is physically open now.

## 11. Final quality judgment

The selected direction is intentionally calmer than the most dramatic references. Its distinctiveness comes from a coherent local-service identity, the repeated request/accept/call grammar, and the different priorities of the two roles. Richness comes from meaningful states, outlet context, real reviews, maps and clear operational actions—not a large inventory of decorative widgets.

The design is resolved enough to implement without another agent choosing an aesthetic, inventing navigation or determining screen behavior. What remains uncertain is empirical performance: real auth, realtime delivery, runtime accessibility and user comprehension. Those are explicit tests in the implementation plan. No claim of user-validated superiority is made.

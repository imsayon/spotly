# Spotly Master Implementation Plan — Design Document

**Status**: Phase 2 Completion + Phase 3 Implementation  
**Last Updated**: April 2026  
**Version**: 2.0 — Production-Grade Architecture

---

## Executive Summary

Spotly is a real-time queue management platform with two consumer-facing applications (Consumer App for queue discovery/joining, Merchant App for queue operations) backed by a NestJS API with Prisma + Supabase PostgreSQL.

This document outlines the complete system architecture, database schema, API design, frontend architecture, and the execution plan for Phase 2 (Consumer Discovery) and Phase 3 (Queue Experience).

**Key Principles**:
- Real-time WebSocket sync for live queue updates
- Geolocation-first consumer discovery
- Premium animations and micro-interactions (Framer Motion)
- Production-grade error handling and loading states
- Atomic database operations for queue token assignment

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPOTLY PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Consumer App    │  │  Merchant App    │  │  Admin Panel │  │
│  │  (Next.js 14)    │  │  (Next.js 14)    │  │  (Future)    │  │
│  │  Port 3000       │  │  Port 3002       │  │              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 │                               │
│                    ┌────────────▼────────────┐                  │
│                    │   NestJS API (3001)    │                  │
│                    │  - REST Endpoints      │                  │
│                    │  - WebSocket Gateway   │                  │
│                    │  - Firebase Auth       │                  │
│                    └────────────┬────────────┘                  │
│                                 │                               │
│        ┌────────────────────────┼────────────────────────┐      │
│        │                        │                        │      │
│   ┌────▼─────┐          ┌──────▼──────┐         ┌──────▼──┐   │
│   │ Supabase │          │  Firebase   │         │  Socket │   │
│   │PostgreSQL│          │    Auth     │         │   .io   │   │
│   │ (Prisma) │          │             │         │ (Redis) │   │
│   └──────────┘          └─────────────┘         └─────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- Framer Motion (animations)
- Zustand (state management)
- Socket.io-client (real-time)
- Tailwind CSS + custom CSS variables
- Lucide React (icons)

**Backend**:
- NestJS 10
- Prisma ORM
- Supabase PostgreSQL
- Firebase Admin SDK (auth only)
- Socket.io (real-time)
- Class Validator (DTO validation)

**Infrastructure**:
- Monorepo: pnpm + Turborepo
- Shared types package (@spotly/types)
- Shared UI package (@spotly/ui)

---

## Database Schema (Prisma)

### Core Models

```prisma
// User — Firebase Auth + Prisma sync
model User {
  id            String   @id  // Firebase UID
  email         String   @unique
  name          String
  phone         String?
  location      String?
  role          UserRole @default(CONSUMER)
  avatar        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  queueEntries  QueueEntry[]
  favorites     FavoriteOutlet[]
  reviews       Review[]
}

enum UserRole {
  CONSUMER
  MERCHANT
}

// Merchant — Business profile
model Merchant {
  id            String   @id @default(uuid())
  ownerId       String   @unique  // Firebase UID of owner
  name          String
  category      String
  description   String?
  phone         String?
  contactEmail  String?
  logoUrl       String?
  verified      Boolean  @default(false)
  rating        Float?   // Aggregated from reviews
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  outlets       Outlet[]
  reviews       Review[]
  favoritedBy   FavoriteOutlet[]
}

// Outlet — Physical location
model Outlet {
  id                    String   @id @default(uuid())
  merchantId            String
  merchant              Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  name                  String
  address               String?
  phone                 String?
  lat                   Float?
  lng                   Float?
  isActive              Boolean  @default(true)
  operatingHours        String?  // "9:00 AM - 9:00 PM"
  avgServeTimeSeconds   Int      @default(300)  // 5 min default
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  queueEntries  QueueEntry[]
  serveEvents   ServeEvent[]
  menuItems     MenuItem[]
  reviews       Review[]

  @@index([merchantId])
}

// QueueEntry — Individual queue position
model QueueEntry {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  outletId      String
  outlet        Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  token         Int      // Unique per outlet per day
  status        QueueStatus @default(WAITING)
  joinedAt      DateTime @default(now())
  calledAt      DateTime?
  servedAt      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  serveEvent    ServeEvent?
  review        Review?

  @@unique([outletId, token])
  @@index([userId])
  @@index([outletId])
  @@index([status])
}

enum QueueStatus {
  WAITING
  CALLED
  SERVED
  MISSED
  CANCELLED
}

// ServeEvent — Track serve times for analytics
model ServeEvent {
  id            String   @id @default(uuid())
  entryId       String   @unique
  entry         QueueEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  outletId      String
  outlet        Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  calledAt      DateTime
  servedAt      DateTime
  duration      Int      // seconds
  createdAt     DateTime @default(now())

  @@index([outletId])
}

// FavoriteOutlet — User's saved merchants
model FavoriteOutlet {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  merchantId    String
  merchant      Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())

  @@unique([userId, merchantId])
  @@index([userId])
}

// Review — Post-serve feedback
model Review {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entryId       String   @unique
  entry         QueueEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  outletId      String
  outlet        Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  rating        Int      // 1-5
  comment       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([outletId])
}

// MenuItem — Outlet menu items
model MenuItem {
  id            String   @id @default(uuid())
  outletId      String
  outlet        Outlet   @relation(fields: [outletId], references: [id], onDelete: Cascade)
  name          String
  category      String
  price         Float
  imageUrl      String?
  inStock       Boolean  @default(true)
  order         Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([outletId])
}
```

---

## API Design

### Authentication

**Firebase Auth Flow**:
1. Client signs in via Firebase (Google OAuth or Phone OTP)
2. Firebase returns ID token
3. Client sends token in `Authorization: Bearer <token>` header
4. NestJS `FirebaseAuthGuard` verifies token
5. On first login, `AuthService.upsertUser` creates/updates Prisma User record

### REST Endpoints

#### Merchant Endpoints

```
GET    /api/merchant                    # List merchants (with filters)
GET    /api/merchant/:id                # Get merchant detail
GET    /api/merchant/me                 # Get current user's merchant
PATCH  /api/merchant/me                 # Update merchant profile
POST   /api/merchant                    # Create merchant (onboarding)

Query params:
  ?category=Coffee                      # Filter by category
  ?search=name                          # Search by name
  ?sort=queue_asc|distance_asc          # Sort order
  ?lat=12.9716&lon=77.5946              # Geolocation
  ?limit=10                             # Limit results
```

#### Outlet Endpoints

```
GET    /api/outlet/merchant/:merchantId # List merchant's outlets
GET    /api/outlet/:id                  # Get outlet detail
POST   /api/outlet                      # Create outlet
PATCH  /api/outlet/:id                  # Update outlet
DELETE /api/outlet/:id                  # Delete outlet
```

#### Queue Endpoints

```
GET    /api/queue/:outletId             # Get queue state + entries
GET    /api/queue/entry/:entryId        # Get single entry
GET    /api/queue/history/:userId       # Get user's queue history
POST   /api/queue/join                  # Join queue
PATCH  /api/queue/entry/:entryId        # Update entry status
POST   /api/queue/entry/:entryId/call   # Call next (merchant only)
POST   /api/queue/entry/:entryId/serve  # Mark served (merchant only)
```

#### User Endpoints

```
GET    /api/user/me                     # Get current user profile
GET    /api/user/favorites              # Get user's favorites
POST   /api/user/favorites              # Add favorite (body: {merchantId})
POST   /api/user/favorites/:merchantId  # Add favorite (param-based)
DELETE /api/user/favorites/:merchantId  # Remove favorite
```

#### Review Endpoints

```
POST   /api/review                      # Submit review
GET    /api/review/merchant/:merchantId # Get merchant reviews + rating
```

#### Analytics Endpoints

```
GET    /api/analytics/outlet/:outletId  # Get outlet analytics
  ?period=today|week|month
  Returns: { totalServed, avgWaitTime, peakHour, hourlyDistribution }
```

### WebSocket Events

**Client → Server**:
```
queue:join          # { outletId, userId }
queue:leave         # { entryId }
queue:subscribe     # { outletId }  — subscribe to outlet updates
```

**Server → Client**:
```
queue:update        # { outletId, entries[], currentToken, avgWaitPerPerson }
queue:called        # { entryId, tokenNumber }
queue:served        # { entryId }
```

---

## Frontend Architecture

### Consumer App Structure

```
apps/consumer/src/
├── app/
│   ├── layout.tsx                 # Root layout + auth provider
│   ├── page.tsx                   # Landing page
│   ├── home/
│   │   ├── layout.tsx             # Home layout + location init
│   │   ├── page.tsx               # Home feed (discovery)
│   │   ├── explore/
│   │   │   └── page.tsx           # Map + list view
│   │   ├── favorites/
│   │   │   └── page.tsx           # Saved merchants
│   │   ├── profile/
│   │   │   └── page.tsx           # User profile + history
│   │   └── queue/
│   │       └── [entryId]/
│   │           └── page.tsx       # Live queue tracker
│   ├── merchant/
│   │   └── [id]/
│   │       └── page.tsx           # Merchant detail
│   └── auth/
│       └── callback/
│           └── page.tsx           # Firebase callback
├── components/
│   ├── AuthProvider.tsx           # Firebase auth setup
│   ├── MerchantCard.tsx           # Reusable merchant card
│   ├── QueueTracker.tsx           # Queue position display
│   └── ...
├── store/
│   ├── auth.store.ts              # User auth state
│   ├── queue.store.ts             # Queue state + WebSocket
│   ├── location.store.ts          # Geolocation state
│   └── ui.store.ts                # UI state (modals, etc)
├── lib/
│   ├── api.ts                     # Axios instance + interceptors
│   ├── firebase.ts                # Firebase config
│   └── socket.ts                  # Socket.io setup
└── styles/
    └── globals.css                # Global styles + animations
```

### Merchant App Structure

```
apps/merchant/src/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx           # Sign in
│   │   └── onboarding/
│   │       └── page.tsx           # Business setup
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout + sidebar
│   │   ├── page.tsx               # Main dashboard
│   │   ├── queue/
│   │   │   └── page.tsx           # Queue operator
│   │   ├── outlets/
│   │   │   ├── page.tsx           # Outlets list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Outlet detail
│   │   ├── analytics/
│   │   │   └── page.tsx           # Analytics dashboard
│   │   ├── business/
│   │   │   └── page.tsx           # Business profile
│   │   └── settings/
│   │       └── page.tsx           # Settings
│   └── auth/
│       └── callback/
│           └── page.tsx           # Firebase callback
├── components/
│   ├── AuthProvider.tsx           # Firebase auth setup
│   ├── Sidebar.tsx                # Navigation sidebar
│   ├── QueueBoard.tsx             # Queue operator board
│   └── ...
├── store/
│   ├── auth.store.ts              # Merchant auth state
│   ├── queue.store.ts             # Queue state
│   └── ui.store.ts                # UI state
├── lib/
│   ├── api.ts                     # Axios instance
│   ├── firebase.ts                # Firebase config
│   └── socket.ts                  # Socket.io setup
└── styles/
    └── globals.css                # Global styles
```

### State Management (Zustand)

**Consumer Auth Store**:
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
}
```

**Consumer Queue Store**:
```typescript
interface QueueState {
  myEntry: QueueEntry | null
  queueEntries: QueueEntry[]
  currentToken: number
  avgWaitPerPerson: number
  wsConnected: boolean
  joinQueue: (outletId: string) => Promise<void>
  leaveQueue: () => Promise<void>
  subscribeToQueue: (outletId: string) => void
  handleQueueUpdate: (payload: QueueUpdatePayload) => void
}
```

**Consumer Location Store**:
```typescript
interface LocationState {
  coords: { lat: number; lon: number } | null
  permissionGranted: boolean
  requestLocation: () => Promise<void>
  initFromSession: () => void
}
```

---

## Phase 2: Consumer Discovery Implementation

### 2.1 Geolocation Flow

**Backend Changes**:
- `MerchantService.findAll` already supports `lat` and `lon` params
- Add `limit` query param to `MerchantController.findAll`
- Compute `distance` for each merchant based on outlet coordinates

**Frontend Changes**:
- `location.store.ts`: Persist coords to `sessionStorage` (not localStorage)
- `home/layout.tsx`: Call `initFromSession()` on mount
- `home/page.tsx`: Pass coords to API on initial fetch

### 2.2 Urgency Hero Card

**Backend**:
- `GET /merchant?sort=queue_asc&limit=1&lat=&lon=` returns single nearest merchant with shortest queue

**Frontend**:
- Consumer home page renders hero card with:
  - Merchant name + category emoji
  - Queue count: "3 spots open"
  - Distance: "0.4 km away"
  - CTA: "Get token now"

### 2.3 Category Filtering

**Frontend**:
- Category pills are clickable
- On click, re-fetch `GET /merchant?category=Coffee&lat=&lon=`
- Animate grid transition with Framer Motion `AnimatePresence`

### 2.4 Live Queue Depth

**Backend**:
- `MerchantService.findAll` includes `_count` on queue entries per outlet
- Aggregate across outlets and return as `currentQueueDepth`

**Frontend**:
- Merchant cards display live badge: "● 8 waiting"
- Badge pulses when recently updated

### 2.5 Merchant Card Redesign

Each card shows:
- Category icon (Lucide React)
- Merchant name
- Live queue badge with pulsing dot
- Estimated wait time (brand color)
- Rating + review count
- Distance (if geolocation granted)
- "Quick" badge if wait < 5 min

---

## Phase 3: Queue Experience Implementation

### 3.1 Enhanced CALLED State

When queue entry status transitions to CALLED:
- Full-screen modal overlay with radial gradient background
- Animated pulsing rings
- Giant token number (120px font)
- "Please proceed to the counter" message
- Countdown timer (2 minutes)
- "Done" button to dismiss

### 3.2 Countdown Timer Component

```typescript
function CountdownTimer({ seconds, color }: { seconds: number; color: string }) {
  // SVG circle with animated stroke-dashoffset
  // Center text showing MM:SS
  // Color changes to red when < 30 seconds
}
```

### 3.3 Review Flow

**Backend**:
- `ReviewService.createReview` validates user was served at outlet
- Prevents duplicate reviews within 24h
- `ReviewController` exposes `POST /review` and `GET /review/merchant/:id`

**Frontend**:
- After SERVED status, show review drawer after 3 second delay
- 5-star rating selector
- Optional comment textarea
- Submit button (disabled until rating selected)
- Skip button

### 3.4 Web Push Notifications

- Request permission at join-queue time
- Fire notification when `token_called` WebSocket event received
- Service worker handles background notifications

### 3.5 Live Badge Component

Shared component in `@spotly/ui`:
```typescript
export function LiveBadge({ connected, label }: LiveBadgeProps) {
  // Pulsing green dot + "Live" text when connected
  // Grey dot + "Offline" when disconnected
}
```

---

## Critical Bug Fixes (Phase 2 Completion)

### Bug 1: Token Race Condition
**File**: `apps/api/src/modules/queue/repositories/prisma-queue.repository.ts`

Use `$transaction` with `findFirst` to atomically assign next token:
```typescript
async joinQueue(data: Omit<QueueEntry, 'id'>): Promise<QueueEntry> {
  const created = await this.prisma.$transaction(async (tx) => {
    const lastEntry = await tx.queueEntry.findFirst({
      where: { outletId: data.outletId, status: { in: ['WAITING', 'CALLED'] } },
      orderBy: { token: 'desc' },
    });
    const nextToken = (lastEntry?.token ?? 0) + 1;
    return tx.queueEntry.create({
      data: { ...data, token: nextToken, status: 'WAITING' },
    });
  });
  return this.mapToDomain(created);
}
```

### Bug 2: MerchantService Sort Order
**File**: `apps/api/src/modules/merchant/merchant.service.ts`

Fetch → compute queue depths → compute distances → sort → limit (in that order)

### Bug 3: MerchantController Missing `limit` Param
**File**: `apps/api/src/modules/merchant/merchant.controller.ts`

Add `@Query('limit') limit?: string` and parse to `parseInt(limit, 10)`

### Bug 4: IntegrationService Mock Data
**File**: `apps/api/src/modules/integration/integration.service.ts`

Add `currentQueueDepth` to mock merchants, add `ENABLE_DEMO_MERCHANTS` feature flag

### Bug 5: UserController Missing Body-Based Favorites
**File**: `apps/api/src/modules/user/user.controller.ts`

Support both `POST /user/favorites` (body) and `POST /user/favorites/:merchantId` (param)

### Bug 6: QueueController Route Order
**File**: `apps/api/src/modules/queue/queue.controller.ts`

Move `GET /queue/entry/:entryId` and `GET /queue/history/:userId` before `GET /queue/:outletId`

---

## Execution Checklist

### Phase 2 Completion (Consumer Discovery)

- [ ] Fix Prisma schema: add `createdAt` to Merchant
- [ ] Fix `@spotly/types`: `ownerId` (not `userId`), add `currentQueueDepth?`
- [ ] Fix `IntegrationService`: `ownerId`, `currentQueueDepth`, feature flag
- [ ] Fix `MerchantService.findAll`: sort order, `limit` support, distance calc
- [ ] Fix `MerchantController`: add `limit` query param
- [ ] Fix `UserController`: body-based favorites endpoint
- [ ] Fix `QueueController`: route order
- [ ] Consumer `location.store.ts`: sessionStorage persistence
- [ ] Consumer `home/page.tsx`: geolocation flow, urgency card, category refetch
- [ ] Consumer `explore/page.tsx`: fix map outlets flatMap
- [ ] Consumer merchant cards: live badges, distance, quick queue highlight

### Phase 3 Implementation (Queue Experience)

- [ ] Consumer queue page: full-screen CALLED state
- [ ] CountdownTimer component: SVG circle + animated countdown
- [ ] ReviewService + ReviewController: backend review flow
- [ ] Consumer queue page: review drawer UI
- [ ] Web Push notifications: permission + service worker
- [ ] LiveBadge component: shared UI component
- [ ] Merchant queue page: use LiveBadge
- [ ] Analytics service: wire real avgServeTimeSeconds

---

## Performance Considerations

### Database Optimization

- Index on `QueueEntry(outletId, status)` for fast queue depth queries
- Index on `FavoriteOutlet(userId)` for favorites list
- Index on `Review(outletId)` for merchant rating aggregation
- Use `_count` in Prisma queries instead of separate count queries

### Frontend Optimization

- Lazy load merchant cards with Intersection Observer
- Debounce search input (300ms)
- Memoize merchant list with `useMemo` to prevent re-renders
- Use `AnimatePresence` for smooth list transitions
- Skeleton cards during fetch (no layout shift)

### WebSocket Optimization

- Subscribe to specific outlet rooms (not broadcast to all)
- Batch queue updates (send every 500ms max)
- Unsubscribe on component unmount
- Reconnect with exponential backoff on disconnect

---

## Security Considerations

- Firebase Auth guards all protected endpoints
- Validate `userId` matches authenticated user before returning personal data
- Rate limit `POST /queue/join` (5 per minute per IP)
- Sanitize review comments (XSS prevention)
- CORS configured for consumer + merchant URLs only
- Environment variables for sensitive config (never commit keys)

---

## Deployment Checklist

- [ ] Run `pnpm build` — zero errors/warnings
- [ ] Run `pnpm type-check` — all types valid
- [ ] Run `pnpm lint` — no linting issues
- [ ] Database migrations applied (`db:push`)
- [ ] Environment variables set in production
- [ ] Firebase service account configured
- [ ] Supabase connection string verified
- [ ] Socket.io Redis adapter configured (if multi-pod)
- [ ] Lighthouse score > 90 on both apps
- [ ] Mobile responsiveness tested
- [ ] WebSocket connectivity tested on slow networks

---

## Future Enhancements (Phase 4+)

- Merchant analytics dashboard with real charts
- Menu management with image uploads
- Loyalty program integration
- SMS/Email notifications
- Advanced search filters
- Merchant verification workflow
- Admin dashboard
- Multi-language support
- Dark/light mode toggle


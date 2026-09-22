
<div align="center">

# Spotly

### Real-Time Digital Queue & Place Discovery Platform

**Discover places. Hold your spot. Skip the physical queue.**

[Consumer App](https://spotly-consumer-q21p.onrender.com) · [Merchant App](https://spotly-merchant-ob90.onrender.com) · [API Health](https://spotly-api-d1dr.onrender.com/api/v1/health)

</div>

---

## Overview

Spotly is a real-time digital queue management and place discovery platform designed for local businesses such as cafes, restaurants, clinics, salons, and service providers.

Instead of physically standing in a queue, customers can discover nearby businesses, request a digital spot remotely, track their queue position in real time, and arrive when their turn approaches.

Businesses receive a dedicated queue management application where they can accept requests, manage active queues, verify customers, manage outlets, and monitor daily activity.

---

## Features

### Consumer Application

- Place discovery through list and map views
- Category-based filtering
- Remote digital queue requests
- Real-time queue position tracking
- Digital token management
- QR-based ticket verification
- Outlet menus and services
- Favorite outlets
- Visit history
- Ratings and reviews

### Merchant Application

- Real-time queue management console
- Accept or decline queue requests
- Call the next customer
- Mark customers as served or missed
- QR-code customer verification
- Multi-outlet management
- Outlet opening hours configuration
- Queue availability controls
- Menu and service management
- Pricing and item availability management
- Daily queue history and activity

---

## Queue Lifecycle

```text
PENDING_ACCEPTANCE
        |
        v
     WAITING
        |
        v
      CALLED
        |
        +------------------+
        |                  |
        v                  v
     SERVED             MISSED
                           |
                           v
                       CANCELLED
````

Queue state changes are synchronized between the consumer and merchant applications using real-time WebSocket events.

---

## System Architecture

```text
                         SPOTLY PLATFORM

              +-----------------------------+
              |        Consumer App         |
              |         Next.js 16          |
              +--------------+--------------+
                             |
                             |
              +--------------v--------------+
              |         Spotly API          |
              |         NestJS 11            |
              |      REST + WebSockets       |
              +--------------+--------------+
                             |
                             |
              +--------------v--------------+
              |      PostgreSQL Database     |
              |          Supabase            |
              +-----------------------------+
                             ^
                             |
              +--------------+--------------+
              |                             |
    +---------+---------+         +---------+---------+
    |   Merchant App    |         |  Supabase Auth    |
    |    Next.js 16     |         |   Authentication   |
    +-------------------+         +-------------------+
```

---

## Repository Structure

```text
spotly/
│
├── apps/
│   ├── consumer-client/       # Consumer-facing application
│   └── merchant-client/       # Merchant queue management application
│
├── server/                    # NestJS REST API and WebSocket server
│
├── packages/
│   ├── database/              # Prisma schema, migrations and seed scripts
│   ├── types/                 # Shared TypeScript types and API contracts
│   └── ui/                    # Shared React UI components
│
├── docs/                      # Product and technical documentation
├── frontend-design/           # Frontend design resources
├── infra/                     # Infrastructure configuration
├── ops/                       # Operational resources
├── scripts/                   # Utility and development scripts
│
├── render.yaml                # Render deployment configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── package.json               # Root project configuration
```

---

## Technology Stack

### Frontend

| Technology            | Purpose                 |
| --------------------- | ----------------------- |
| Next.js 16            | Frontend framework      |
| React 19              | UI library              |
| TypeScript 5.8        | Type-safe development   |
| Tailwind CSS v4       | Styling                 |
| Zustand 5             | State management        |
| Leaflet               | Interactive maps        |
| React-Leaflet         | React map integration   |
| Socket.IO Client      | Real-time communication |
| Axios                 | HTTP requests           |
| Lucide React          | Interface icons         |
| IBM Plex Sans & Serif | Typography              |
| Zod                   | Validation              |

Both frontend applications use Next.js static exports and are deployed as Render Static Sites.

### Backend

| Technology        | Purpose                 |
| ----------------- | ----------------------- |
| NestJS 11         | Backend framework       |
| Node.js 24        | Runtime                 |
| Socket.IO         | Real-time communication |
| Helmet            | HTTP security           |
| CORS              | Cross-origin protection |
| NestJS Throttler  | Rate limiting           |
| Zod               | Validation              |
| class-validator   | Request validation      |
| Swagger / OpenAPI | API documentation       |
| Pino              | Application logging     |

### Database and Authentication

| Technology                | Purpose                             |
| ------------------------- | ----------------------------------- |
| PostgreSQL                | Primary database                    |
| Supabase                  | Database hosting and authentication |
| Prisma 7.9                | ORM                                 |
| Supabase Auth             | Authentication                      |
| Prisma PostgreSQL Adapter | Database connectivity               |

### User Roles

```text
CONSUMER
MERCHANT
ADMIN
```

### DevOps and Tooling

| Technology       | Purpose                               |
| ---------------- | ------------------------------------- |
| pnpm 11          | Package management                    |
| Corepack         | Package manager management            |
| Turborepo        | Monorepo builds and caching           |
| Render           | Cloud deployment                      |
| Render Blueprint | Infrastructure as Code                |
| Supabase         | Managed PostgreSQL and authentication |

---

## Real-Time Architecture

Spotly uses Socket.IO to synchronize queue activity between consumers and merchants.

```text
Merchant
   |
   | Call Next Customer
   v
Spotly API
   |
   | WebSocket Event
   v
Consumer Application
   |
   v
Queue Status Updated
```

This allows customers to receive queue updates without repeatedly refreshing the application.

---

## Authentication and Security

Authentication is handled through Supabase Auth with application-level role management.

```text
                    Authentication
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          CONSUMER    MERCHANT      ADMIN
              |           |           |
              +-----------+-----------+
                          |
                          v
                     Spotly API
```

Security mechanisms include:

* Supabase Authentication
* Role-based access control
* CORS protection
* Helmet security headers
* API rate limiting
* Request validation
* QR and token verification

---

## Application Flow

### Consumer Flow

```text
Discover a Place
       |
       v
View Outlet
       |
       v
Request Digital Spot
       |
       v
Merchant Accepts Request
       |
       v
Join Digital Queue
       |
       v
Track Queue in Real Time
       |
       v
Customer Gets Called
       |
       v
QR / Token Verification
       |
       v
Service Completed
```

### Merchant Flow

```text
Customer Requests Spot
          |
          v
Merchant Receives Request
          |
          v
Accept / Decline
          |
          v
Customer Added to Queue
          |
          v
Call Next Customer
          |
          v
Verify Customer
          |
          v
Serve Customer
          |
          v
Mark Served / Missed
```

---

## Deployment

Spotly is deployed using Render, with Supabase providing PostgreSQL and authentication services.

| Service              | Platform           | Status |
| -------------------- | ------------------ | ------ |
| Consumer Application | Render Static Site | Live   |
| Merchant Application | Render Static Site | Live   |
| API Server           | Render Web Service | Live   |
| PostgreSQL           | Supabase           | Live   |
| Authentication       | Supabase Auth      | Live   |

### Live Applications

**Consumer Application**

[https://spotly-consumer-q21p.onrender.com](https://spotly-consumer-q21p.onrender.com)

**Merchant Application**

[https://spotly-merchant-ob90.onrender.com](https://spotly-merchant-ob90.onrender.com)

**API**

[https://spotly-api-d1dr.onrender.com/api/v1](https://spotly-api-d1dr.onrender.com/api/v1)

**API Health Check**

[https://spotly-api-d1dr.onrender.com/api/v1/health](https://spotly-api-d1dr.onrender.com/api/v1/health)

The API is hosted on Render. On the free tier, the service may spin down after inactivity, which can result in a delay when the service starts again.

---

## Local Development

### Prerequisites

* Node.js 24+
* pnpm 11+
* Git
* A Supabase project
* Required environment variables

### Clone the Repository

```bash
git clone <repository-url>
cd spotly
```

### Enable pnpm

```bash
corepack enable
```

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Configure the required environment variables for the API, database, and frontend applications.

Example:

```env
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_API_URL=your_api_url
```

Do not commit `.env` files or production credentials to the repository.

---

## Database Setup

Spotly uses Prisma with PostgreSQL.

Generate the Prisma client:

```bash
pnpm prisma generate
```

For development:

```bash
pnpm prisma migrate dev
```

For production:

```bash
pnpm prisma migrate deploy
```

If a seed script is configured:

```bash
pnpm prisma db seed
```

---

## Running the Project

Start the development environment:

```bash
pnpm dev
```

Individual applications can also be started separately.

### Consumer Application

```bash
pnpm --filter consumer-client dev
```

### Merchant Application

```bash
pnpm --filter merchant-client dev
```

### API Server

```bash
pnpm --filter server dev
```

---

## API

The Spotly backend exposes a versioned REST API:

```text
/api/v1
```

### Health Check

```http
GET /api/v1/health
```

API documentation is provided through Swagger/OpenAPI.

---

## Shared Packages

### `packages/database`

Responsible for:

* Prisma schema
* Database migrations
* Database configuration
* Seed scripts

### `packages/types`

Contains:

* TypeScript interfaces
* DTOs
* API contracts
* Domain types

### `packages/ui`

Contains reusable:

* React components
* UI primitives
* Design-system components

Shared packages allow the consumer and merchant applications to reuse common types, contracts, and UI components.

---

## Design Goals

### Reduce Physical Waiting

Customers should not have to remain physically present while waiting for their turn.

### Provide Real-Time Visibility

Customers and businesses should have a shared, continuously updated view of queue activity.

### Simplify Queue Operations

Businesses should be able to manage queues, customers, outlets, menus, and services from a centralized application.

---

## Future Scope

Potential future extensions include:

* Push notifications
* Advanced merchant analytics
* Queue-time prediction
* Demand forecasting
* Integrated payments
* Advanced review and reputation systems
* Business performance dashboards
* Enterprise multi-location management
* Native mobile applications

---

## Project

Spotly is a private project developed as a complete digital queue management and place discovery platform.

The repository contains the consumer application, merchant application, backend API, shared packages, database configuration, and deployment configuration.

---

<div align="center">

<img src="docs/logo.png" alt="Spotly Logo" width="45">

**Spotly**

Real-time digital queue management and place discovery.

</div>

# Spotly

Queue management platform — modular monorepo with independent sub-projects.

## Structure

```
spotly/
├── client/
│   ├── consumer/     # React Native (Expo) — end-user app
│   └── merchant/     # React Native (Expo) — merchant dashboard
├── server/           # NestJS API — REST + WebSocket + BullMQ
├── infra/            # Docker Compose, Nginx, infra configs
└── ml/               # (future) Python ML service
```

Each sub-project is fully self-contained with its own `package.json`, lockfile, and `Dockerfile`.

---

## Quick Start

### Prerequisites
- Node.js ≥ 22
- Docker + Docker Compose
- Expo CLI (`npm i -g expo-cli`)

### 1. Start infrastructure
```bash
cd infra
cp .env.example .env   # fill in values
docker compose up -d
```

### 2. Run the server
```bash
cd server
cp .env.example .env   # fill in values
npm install
npm run prisma:migrate
npm run start:dev
```

### 3. Run the consumer app
```bash
cd client/consumer
cp .env.example .env
npm install
npm start
```

### 4. Run the merchant app
```bash
cd client/merchant
cp .env.example .env
npm install
npm start
```

---

## Architecture

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| API      | NestJS 11, Prisma 7, PostgreSQL         |
| Queue    | BullMQ + Redis                          |
| Realtime | Socket.IO (WebSocket)                   |
| Client   | React Native + Expo Router + Zustand    |
| Infra    | Docker, Nginx                           |

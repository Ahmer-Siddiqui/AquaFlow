# AquaFlow Backend — Modular Monolith Architecture

This service powers the multi-tenant backend for **AquaFlow**, built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM.

---

## 🏛️ Architecture Highlights

- **Clean Architecture 4-Tier Pattern**: Controller -> Service -> Repository -> Prisma ORM.
- **Composition Root**: Central dependency injection wiring in `src/core/container.ts`.
- **Multi-Tenant Scoping**: All operational tables carry `businessId`. Queries enforce tenant filters via repository methods and middleware guards.
- **Empty Bottle Ledger**: Append-only `BottleLedgerEntry` tracking full delivered, empty returned, damaged, and customer deposits.
- **Background Jobs**: BullMQ and Redis for idempotent recurring subscription order dispatch.
- **Real-Time Sockets**: Socket.IO for live driver dispatch, delivery completion, and stock alerts.

---

## 🚀 Getting Started

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start development server:
   ```bash
   npm run dev
   ```


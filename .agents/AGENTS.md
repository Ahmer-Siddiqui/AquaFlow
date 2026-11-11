# AquaFlow — Master Agent Instructions & Architectural Blueprint

Welcome to the **AquaFlow** workspace (`d:\Backend Portfolio\AquaFlow`). AquaFlow is an enterprise-grade, multi-tenant **Water Supply and Distribution Management SaaS Platform** serving drinking water businesses delivering 19L, 12L, and 6L water bottles and beverage accessories.

This document establishes the foundational architectural rules, coding standards, context management protocols, and operating procedures for AI assistants.

---

## 1. Project Overview & Business Domain

- **Project Name:** AquaFlow SaaS (`aquaflow`)
- **Domain:** Multi-tenant Water Supply & Bottle Distribution Operations, Logistics, Subscription Automation, and Financial Ledger.
- **Target Audience:**
  1. **Super Admin**: Platform owner managing SaaS plans, business onboarding, global metrics, and system audits.
  2. **Business Owner**: Water plant/depot owner managing branches, pricing, delivery zones, staff permissions, and financial statements.
  3. **Manager / Dispatcher**: Operations manager assigning daily delivery routes, managing orders, and monitoring stock.
  4. **Accountant**: Financial officer recording expenses, verifying cash-on-delivery collections, and reviewing profit/loss.
  5. **Delivery Staff**: Field drivers using a mobile-optimized panel to view routes, update statuses, collect cash, and record returned empty bottles.
  6. **Customer**: Residential and corporate consumers ordering bottles, setting up recurring subscriptions, and tracking bottle deposits.

---

## 2. Tech Stack & Dependencies

### Backend Stack
- **Runtime & Language:** Node.js (ESM / LTS), TypeScript 5.x (`"target": "ES2022"`, `"moduleResolution": "NodeNext"`).
- **Framework:** Express.js 4.x / 5.x with RESTful `/api/v1` architecture.
- **Database & ORM:** PostgreSQL 16+ with Prisma ORM 5.x / 6.x.
- **Multi-Tenancy:** Shared database, shared schema with tenant scoping (`businessId`), foreign keys, compound indexes, and PostgreSQL Row Level Security (RLS).
- **Caching & Job Queue:** Redis 7+ and BullMQ (for recurring subscription dispatch, notification jobs, and daily schedule generation).
- **Real-Time Communication:** Socket.IO (for live delivery status updates, driver location pings, and dispatch alerts).
- **Validation:** Zod schemas for all incoming HTTP payloads (body, query, params).
- **Security & Auth:** Argon2 / bcrypt password hashing, JWT access tokens, refresh token rotation with secure HTTP-only cookies, and granular RBAC.
- **Testing:** Vitest, Supertest, and Playwright for E2E.
- **Documentation:** Swagger / OpenAPI 3.0 specification.

### Frontend Stack
- **Core:** React.js 18+, TypeScript 5.x, Vite.
- **Styling & UI:** Tailwind CSS, shadcn/ui, Radix UI primitives, Lucide React icons.
- **Theme:** Clean white and light-blue visual palette, deep navy typography (`#0f172a`), crisp card borders, accessible contrast.
- **State Management:** Redux Toolkit (for global session, active business, and cart) + TanStack Query (React Query v5) for server state caching and optimistic updates.
- **Forms & Validation:** React Hook Form + Zod resolvers.
- **Charts & Dashboards:** Recharts for analytics, revenue, bottle returns, and delivery performance.
- **Routing:** React Router v6+ with layout guards for the 4 distinct interfaces:
  - `/admin/*` (Super Admin Panel)
  - `/business/*` (Business Admin & Operations Panel)
  - `/delivery/*` (Delivery Staff Mobile-Optimized Panel)
  - `/portal/*` (Customer Web App & Ordering Portal)

---

## 3. Target 4-Tier Clean Architecture (Modular Monolith)

The backend is structured into a strict **4-Tier Clean Architecture** with domain modules and a central **Dependency Injection (DI) Composition Root**:

```text
[ HTTP Client / Frontend ]
       │
       ▼
[ Routes & Middlewares ] ──────► authMiddleware, tenantScopeGuard, rolePermissionGuard, validate(zodSchema)
       │
       ▼
[ Controllers (src/modules/<module>/controllers) ] ──► Presentation layer only. Handles HTTP status, headers, and delegates to Services.
       │
       ▼
[ Services (src/modules/<module>/services) ] ──────► Pure domain logic, transaction boundaries, invariants, business rules.
       │
       ▼
[ Repositories (src/modules/<module>/repositories) ] ─► Data access layer. Encapsulates Prisma queries, compound filters, tenant scoping.
       │
       ▼
[ Prisma ORM & Database Layer ] ───────────────────► Schema models, PostgreSQL migrations, foreign keys, RLS policies.
       │
       ▼
[ PostgreSQL 16+ & Redis ]
```

---

## 4. Key Rules for AI Agents

1. **Deep Thinking First:** Never rush to output arbitrary code. Design data flow, failure modes, transaction boundaries, and tenant isolation before typing code.
2. **Strict Multi-Tenancy:** Every tenant operation MUST check membership and enforce `where: { businessId }`. Never trust client-supplied business IDs.
3. **Immutable Bottle Ledger:** Track all full bottles delivered, empty bottles returned, and damaged bottles via `BottleLedgerEntry`. Balance fields must always reconcile with ledger sum.
4. **Idempotent Background Jobs:** Subscription auto-order generation via BullMQ must be idempotent with deterministic keys to prevent duplicate order generation.
5. **Context Synchronization:** Always update `.agents/context/FEATURE_LOG.md` after any milestone and verify type safety with `npx tsc --noEmit`.


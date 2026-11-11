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

### ⚠️ Critical Layering Constraints:
1. **Controllers NEVER access Prisma Client or Repositories directly.** Controllers only interact with injected Services.
2. **Services NEVER call `prisma.<entity>.findMany()`, `prisma.<entity>.create()`, etc. directly.** All database queries are encapsulated inside dedicated Repository classes.
3. **Repository Pattern:**
   - Define repository interface in `src/modules/<module>/interfaces/I<Entity>Repository.ts`.
   - Implement repository in `src/modules/<module>/repositories/<entity>.repository.ts`.
4. **Service Pattern:**
   - Define service interface in `src/modules/<module>/interfaces/I<Entity>Service.ts`.
   - Implement business logic in `src/modules/<module>/services/<entity>.service.ts`.
5. **Central Composition Root (`src/core/container.ts`):**
   - All Repositories, Services, and Controllers are instantiated and wired via a single DI container.
6. **Routes:**
   - Routes consume controller instances directly from the DI container (`container.<entity>Controller.<action>`).
7. **Multi-Tenant Scoping Rule:**
   - Every tenant query MUST enforce `where: { businessId }`. Never trust a `businessId` sent in the request body or query parameter without verifying the authenticated user's active business membership!

---

## 4. Directory Structure Reference

```text
AquaFlow/
├── .agents/                    # Agent brains, rules, skills, and context
│   ├── rules/                  # Senior mentor operating rules (00 to 10)
│   ├── skills/                 # Procedural skill playbooks (build-feature, postgresql-prisma, etc.)
│   ├── context/                # Project master context, feature logs, known footguns, domain specs
│   │   └── modules/            # 14 Detailed domain module specification documents
│   └── AGENTS.md               # Agent reference mirror
├── backend/                    # Node.js + Express + TypeScript + Prisma Modular Monolith
│   ├── src/
│   │   ├── config/             # Environment, DB, Redis, Logger configs
│   │   ├── core/               # Composition root (container.ts), base repository, base service
│   │   ├── middlewares/        # Auth, Tenant Scope, RBAC, Validation, Error Handler
│   │   ├── modules/            # Domain-driven modules (auth, business, orders, bottle-ledger, etc.)
│   │   ├── jobs/               # BullMQ queue definitions, workers, and schedulers
│   │   ├── sockets/            # Socket.IO connection handlers and real-time events
│   │   └── utils/              # ApiResponse, AppError, Decimal math, JWT, Hash utilities
│   ├── prisma/                 # Prisma schema, migrations, seed data
│   ├── tests/                  # Unit, integration, tenant-isolation, and E2E tests
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # React + TypeScript + Vite + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/                # Redux store, query client, router config
│   │   ├── components/         # Shared UI components (shadcn/ui, buttons, tables, dialogs)
│   │   ├── layouts/            # 4 Distinct layouts (SuperAdmin, BusinessAdmin, Delivery, Customer)
│   │   ├── features/           # Feature slices (auth, orders, bottle-ledger, inventory, etc.)
│   │   ├── hooks/              # Custom hooks (useAuth, useTenant, useSocket, useBottleBalance)
│   │   ├── services/           # Axios / Fetch API clients with token refresh interceptors
│   │   └── utils/              # Formatters, currency formatters, date utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # PostgreSQL, Redis, Backend, Frontend local development stack
├── AGENTS.md                   # Root agent instructions
├── README.md                   # Master project documentation, architecture, ERD & setup
├── ROADMAP.md                  # High-level architecture & phased implementation roadmap
└── feature.md                  # Comprehensive step-by-step feature checklist & audit tracker
```

---

## 5. Coding Standards & Conventions

### A. Error Handling & Standard API Responses
- All API responses must follow the standard envelope:
  ```typescript
  // Success Response
  {
    "success": true,
    "message": "Orders retrieved successfully",
    "data": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 142,
      "totalPages": 8
    }
  }

  // Error Response
  {
    "success": false,
    "error": {
      "code": "ORDER_ALREADY_DISPATCHED",
      "message": "Cannot cancel an order that is already out for delivery",
      "details": []
    }
  }
  ```
- Use `AppError(message, statusCode, errorCode, details)` for all expected business exceptions.
- Global centralized error middleware catches unhandled exceptions, Prisma errors (P2002 duplicate, P2025 not found), and Zod validation errors.

### B. Monetary & Financial Precision
- **NEVER use standard JavaScript floating-point numbers (`0.1 + 0.2 = 0.30000000000000004`) for currency or bottle balances!**
- Use `Prisma.Decimal` or store minor units (cents/paisa as integers).
- Keep bottle deposit balances strictly segregated from ordinary operational sales revenue.

### C. Empty Bottle Ledger Invariants
- Empty bottles are high-value physical assets.
- Full bottles delivered + Empty bottles returned = Net outstanding bottle balance.
- All balance modifications must be backed by an **immutable ledger entry** (`BottleLedgerEntry`). Never directly overwrite a balance field without writing a corresponding ledger row!

---

## 6. Verification & Quality Gates

Before marking any task as complete:
1. **Type Safety Gate:** Autonomous execution of `npx tsc --noEmit` on both backend and frontend. Zero TypeScript errors allowed.
2. **Tenant Isolation Gate:** Automated tests proving Tenant A cannot access Tenant B's data under any condition.
3. **No Mocks or Fake UI:** Real database tables, actual API endpoints, and working UI forms. No hardcoded buttons or static placeholders.
4. **Context Synchronization:** Always update `.agents/context/FEATURE_LOG.md` and check off items in `feature.md`.


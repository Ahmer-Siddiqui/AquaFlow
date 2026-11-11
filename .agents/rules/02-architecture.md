# Rule 02: Architecture & Design System

## 🏛️ 1. Modular Monolith & Clean Architecture

AquaFlow is engineered as a **Modular Monolith** in Node.js / Express / TypeScript backed by PostgreSQL and Prisma ORM, coupled with a Feature-First React / Vite frontend.

### A. The 4-Tier Backend Pattern
```text
[ Client HTTP Request ]
       │
       ▼
[ Routes & Middlewares ] ────────► authMiddleware, tenantScopeGuard, rolePermissionGuard, validate(zodSchema)
       │
       ▼
[ Controllers ] ─────────────────► Express HTTP handling (req, res, next), HTTP status codes, pagination envelopes
       │
       ▼
[ Services ] ────────────────────► Pure business logic, invariants, Prisma transaction orchestration, event emission
       │
       ▼
[ Repositories ] ────────────────► Prisma client queries, tenant scoping (businessId), compound filters
       │
       ▼
[ Database & Infrastructure ] ───► PostgreSQL 16+, Redis 7+, BullMQ, Socket.IO
```

### B. Dependency Injection & Central Composition Root
All controllers, services, and repositories are registered and wired inside `src/core/container.ts`.

Rules:
1. **Never use static global service singletons** inside controllers.
2. **Never import Prisma directly in controllers or services**. All queries must go through `src/modules/<module>/repositories/<entity>.repository.ts`.
3. Repositories implement interfaces defined in `src/modules/<module>/interfaces/I<Entity>Repository.ts`.
4. Services implement interfaces defined in `src/modules/<module>/interfaces/I<Entity>Service.ts`.

---

## 🌐 2. API Versioning & Envelopes

All backend routes are mounted under:
`/api/v1/<module>`

### Standard Success Envelope
```typescript
interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
  };
}
```

### Standard Error Envelope
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
  };
}
```

---

## 🎨 3. Frontend Architecture

The frontend (`frontend/src`) follows a **Feature-Driven Architecture**:
- `features/auth/`
- `features/business-admin/`
- `features/super-admin/`
- `features/delivery-panel/`
- `features/customer-portal/`
- `features/orders/`
- `features/bottle-ledger/`
- `features/inventory/`
- `features/subscriptions/`
- `features/payments/`
- `features/reports/`

### State Management Strategy:
- **Server State**: TanStack Query (React Query v5) handles all caching, pagination, background refetching, and optimistic mutations.
- **Client/Session State**: Redux Toolkit handles user auth session, active tenant selection, and customer shopping cart.
- **Forms**: React Hook Form with Zod validation schemas shared or synced with backend contracts.


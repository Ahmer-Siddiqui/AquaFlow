---
name: build-feature
description: "End-to-end procedural playbook for building or expanding any feature or module in AquaFlow. Enforces the complete pipeline from Domain Spec, Prisma Schema, Repositories, Services, Controllers, Zod Validators, Express Routes, DI Container wiring, Frontend UI with TanStack Query & shadcn/ui, and closed-loop verification."
metadata:
  author: aquaflow-architect
  version: "1.0.0"
---

# Build Feature Playbook (AquaFlow SaaS Pipeline)

Use this skill whenever instructed to build, implement, or expand any domain feature, resource, or endpoint in AquaFlow.

---

## 🎯 Pre-Flight Checklist

Before writing any line of code:
1. **Locate Domain Spec**: Open and read `.agents/context/modules/<module-name>.md`.
2. **Review Invariants**: Read `.agents/rules/06-verification-and-quality-gates.md` and check `.agents/context/KNOWN_FOOTGUNS.md`.
3. **Multi-Tenancy Check**: Confirm if this entity belongs to a tenant (`businessId` scoping) or is platform-wide (Super Admin).

---

## 🏗️ The 9-Stage Feature Execution Workflow

### Stage 1: Domain Specification Review
- Identify inputs, outputs, query filters, authorization roles, and business invariants.

### Stage 2: Prisma Schema & Migration (`backend/prisma/`)
- Define or update model in `prisma/schema.prisma`.
- Ensure compound indexes (`@@index([businessId, status])`).
- Add foreign key relationships and cascade/restrict rules.
- Format with `npx prisma format`.

### Stage 3: Repository Contract & Implementation (`backend/src/modules/<module>/`)
- Create interface `src/modules/<module>/interfaces/I<Name>Repository.ts`.
- Create implementation `src/modules/<module>/repositories/<name>.repository.ts`.
- Enforce `{ where: { businessId } }` on all tenant-scoped queries.

### Stage 4: Zod Validation Schemas & DTOs
- Create `src/modules/<module>/validators/<name>.validator.ts`.
- Define atomic body schema, query params schema, and route params schema.
- Export strongly typed DTOs using `z.infer`.

### Stage 5: Service Contract & Business Invariants
- Create interface `src/modules/<module>/interfaces/I<Name>Service.ts`.
- Create implementation `src/modules/<module>/services/<name>.service.ts`.
- Inject repositories via constructor.
- Use `prisma.$transaction` for all multi-step atomic operations.
- Throw `AppError` on rule violations.

### Stage 6: Controller & Route Wiring
- Create `src/modules/<module>/controllers/<name>.controller.ts`.
- Register in Central Composition Root `src/core/container.ts`.
- Mount in `src/modules/<module>/routes/<name>.routes.ts` with `authMiddleware`, `tenantScopeGuard`, and `validate(schema)`.

### Stage 7: Automated Tests (`backend/tests/`)
- Write unit tests for business logic in `tests/unit/`.
- Write integration tests for API endpoints and tenant isolation in `tests/integration/`.

### Stage 8: Frontend Feature Implementation (`frontend/src/features/<module>/`)
- Define API client and TanStack Query hooks.
- Build responsive UI with Tailwind CSS and shadcn/ui.
- Integrate React Hook Form + Zod resolver.
- Handle loading skeletons, error states, and empty states.

### Stage 9: Closed-Loop Verification
- Run `npx tsc --noEmit` across backend and frontend.
- Update `.agents/context/FEATURE_LOG.md` and check off items in `feature.md`.


# Rule 03: Feature Build Guidelines & Engineering Pipeline

## 🎯 The 9-Stage Feature Construction Pipeline

Whenever building or expanding any module or feature in AquaFlow, follow this step-by-step pipeline:

```text
Stage 1: Domain Specification Review (.agents/context/modules/)
   │
Stage 2: Prisma Schema & Migration (prisma/schema.prisma)
   │
Stage 3: Repository Interface & Prisma Implementation (interfaces/ & repositories/)
   │
Stage 4: Zod Validation Schemas & TypeScript DTOs (validators/ & dtos/)
   │
Stage 5: Service Interface & Business Logic Implementation (interfaces/ & services/)
   │
Stage 6: Express Controller & Route Wiring (controllers/, routes/, container.ts)
   │
Stage 7: Automated Unit & Integration Tests (tests/)
   │
Stage 8: Frontend Feature Implementation (frontend/src/features/<module>/)
   │
Stage 9: Closed-Loop Verification Gate (tsc --noEmit, test runner, feature tracking update)
```

---

## 📋 Stage Details

### Stage 1: Domain Spec Review
Read the module document in `.agents/context/modules/<module-number>-<name>.md`. Confirm:
- Is this entity tenant-scoped (`businessId`)?
- What are the business invariants (e.g., cannot refund deposit if bottle is not returned)?
- What roles are allowed to access each operation?

### Stage 2: Database Schema
- Define models in `prisma/schema.prisma`.
- Ensure compound indexes: `@@index([businessId, status])`.
- Ensure money fields use `Decimal` or integer minor units.
- Run `npx prisma format`.

### Stage 3: Repository Pattern
- Define `I<Entity>Repository.ts`.
- Implement `<entity>.repository.ts` ensuring all tenant queries include `{ where: { businessId, ... } }`.

### Stage 4: Zod Validators & DTOs
- Create atomic schemas in `validators/<entity>.validator.ts`.
- Export DTO types using `z.infer<typeof schema>`.

### Stage 5: Service Layer
- Put core business rules, calculations, and transactional operations inside `services/<entity>.service.ts`.
- Throw typed `AppError` on invariant violations.

### Stage 6: Presentation & DI Wiring
- Implement `<entity>.controller.ts`.
- Wire in `src/core/container.ts`.
- Mount routes with `authMiddleware`, `tenantScopeGuard`, and `validate(schema)`.

### Stage 7: Testing
- Write integration tests checking:
  1. Success path
  2. Validation failures (400)
  3. Multi-tenant isolation (Tenant B cannot access Tenant A's record)

### Stage 8: Frontend UI
- Create components using shadcn/ui.
- Integrate with TanStack Query hooks.
- Provide loading skeletons, error toasts, and empty states.

### Stage 9: Closed-Loop Check
- Run `npx tsc --noEmit` across both backend and frontend.
- Update `FEATURE_LOG.md` and check off items in `feature.md`.


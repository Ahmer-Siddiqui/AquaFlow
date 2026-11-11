# AquaFlow — Operational & Engineering Prompts

This file provides battle-tested prompts for developing, testing, migrating, and verifying modules in AquaFlow.

---

## 🛠️ Prompt 1: Building a New Module
```text
Implement the [Module Name] module following the 9-stage pipeline from .agents/rules/03-build-guidelines.md:
1. Review .agents/context/modules/[module-spec].md
2. Create/update Prisma schema with multi-tenant index @@index([businessId, ...])
3. Create I[Entity]Repository and implement [Entity]Repository with where: { businessId }
4. Define Zod validators and export DTO types
5. Create I[Entity]Service and implement domain rules and AppError throws
6. Create [Entity]Controller and wire into src/core/container.ts
7. Mount routes with authMiddleware, tenantScopeGuard, and validate(schema)
8. Run npx tsc --noEmit and verify 0 errors
9. Update .agents/context/FEATURE_LOG.md and feature.md
```

---

## 🧪 Prompt 2: Writing a Multi-Tenant Isolation Test
```text
Write a comprehensive integration test in tests/integration/[module].test.ts:
1. Seed two businesses (Business Alpha and Business Beta) with distinct users.
2. Create a [Module] resource under Business Alpha.
3. Attempt to read, update, and delete that resource using an auth token from Business Beta.
4. Verify HTTP 404/403 status is returned and zero data leaks across tenants.
```

---

## 📦 Prompt 3: Testing Empty Bottle Ledger Invariants
```text
Write a unit test for the Bottle Ledger Service verifying the following double-entry lifecycle:
1. Customer receives 10 full 19L bottles and returns 0 empty bottles.
2. Assert outstanding bottle balance is 10 and bottle deposit liability increases accordingly.
3. Customer receives 5 full 19L bottles and returns 7 empty bottles.
4. Assert outstanding bottle balance is now 8.
5. Customer attempts to return 12 empty bottles (more than outstanding balance) without manager override flag.
6. Assert service throws AppError with code 'EXCESS_BOTTLE_RETURN_REJECTED'.
```


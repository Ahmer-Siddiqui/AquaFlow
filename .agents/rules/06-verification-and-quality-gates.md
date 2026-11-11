# Rule 06: Verification & Quality Gates

## 🛡️ Production Quality Gates

AquaFlow enforces strict, non-negotiable quality gates:

### Gate 1: Static Type Safety
- `npx tsc --noEmit` must pass with **0 errors**.
- Strict TypeScript configuration (`"strict": true`, `"noImplicitAny": true`).
- No use of `any` or `@ts-ignore` without explicit architectural justification.

### Gate 2: Multi-Tenant Data Isolation
- Automated tests must verify that:
  - User of Tenant A cannot query, update, or delete records belonging to Tenant B.
  - Passing `?businessId=xyz` in query params from an unauthorized user yields `403 Forbidden` or `404 Not Found`.

### Gate 3: Invariant Consistency
- Inventory cannot go below zero unless explicit back-ordering is enabled in business settings.
- Customer bottle balance must equal `sum(fullDelivered) - sum(emptyReturned) - sum(damagedCount)`.
- Cash collected by drivers must balance with reconciled cash payments in accounting.

### Gate 4: Zero Mocks / Fake UI
- All forms must submit real payloads to the backend API.
- All dashboard charts must display data fetched from backend analytical queries.
- No dummy static arrays inside completed feature components.


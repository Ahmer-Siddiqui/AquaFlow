# Rule 09: Production-Grade Testing Standards

## 🧪 Testing Pyramid for AquaFlow

```text
       ┌─────────────┐
       │     E2E     │  Playwright (Critical User Journeys across 4 Panels)
       ├─────────────┤
       │ Integration │  Supertest + Test PostgreSQL DB (API & Tenant Isolation)
       ├─────────────┤
       │    Unit     │  Vitest (Services, Invariants, Bottle Ledger, Money Math)
       └─────────────┘
```

---

## 🎯 Mandatory Test Suites

1. **Tenant Isolation Suite**:
   - Seed two separate businesses: `Business A` and `Business B`.
   - Authenticate as `Manager A`.
   - Verify that attempts to fetch, update, or delete `Customer B`, `Order B`, or `Product B` return `404 Not Found` or `403 Forbidden`.

2. **Bottle Ledger & Deposit Test Suite**:
   - Customer starts with 0 bottles and 0 deposit.
   - Order 1: 5 bottles delivered (19L). Ledger records +5 delivered. Deposit added.
   - Order 2: 3 bottles delivered, 4 empty bottles returned.
   - Assert: Outstanding bottles = 4. Deposit balance updated accurately.
   - Assert: Cannot return more empty bottles than total ever delivered without manager override flag.

3. **Order & Stock Atomic Consistency Suite**:
   - Product stock = 10 units.
   - Two concurrent orders for 8 units each.
   - Transactional isolation ensures only one order succeeds, second order fails with `INSUFFICIENT_STOCK`.

4. **BullMQ Idempotent Scheduler Suite**:
   - Trigger daily subscription order generation job twice with the same date key.
   - Verify exactly one batch of orders is generated.


# AquaFlow — Known Architectural & Domain Footguns

This document lists subtle traps, concurrency hazards, and architectural mistakes specific to **water supply multi-tenant SaaS** and how to avoid them.

---

## 💣 1. Empty Bottle Balance Mismatch (The Ghost Bottle Trap)

### The Problem:
Water businesses frequently suffer from missing 19L bottles. A naive developer creates a single mutable `customer.bottleBalance` column and runs `customer.bottleBalance += 5` on delivery and `customer.bottleBalance -= 3` on return.
If a delivery fails, is rolled back, or a network request retries, the counter drifts from reality with zero audit trail.

### The Invariant & Defense:
- **Never mutate customer balance without inserting a `BottleLedgerEntry`**.
- The `BottleLedgerEntry` is strictly immutable (append-only).
- Outstanding customer bottles MUST always satisfy:
  $$\text{Outstanding Bottles} = \sum \text{Full Delivered} - \sum \text{Empty Returned} - \sum \text{Damaged Count}$$
- If an order is cancelled or refunded, append a compensating reversal entry.

---

## 💣 2. Deposit Revenue vs. Operational Sales Revenue

### The Problem:
When a customer pays \$5 for water and a \$10 deposit for the bottle, recording \$15 as "Sales Revenue" is an accounting violation. Bottle deposits are **liabilities**, not revenue, because the deposit must be returned when the customer surrenders the bottle!

### The Invariant & Defense:
- Keep `depositTotal` strictly separated from `salesTotal` on orders and invoices.
- In P&L reports, deposits are tracked under **Customer Deposit Liability Accounts**, while water sales and delivery fees are tracked under **Operational Revenue**.

---

## 💣 3. Cross-Tenant Data Leaks via Query Parameter Manipulation

### The Problem:
An API endpoint accepts `GET /api/v1/orders?businessId=xyz`. A malicious user authenticated in Business A passes the `businessId` of Business B to spy on their orders.

### The Invariant & Defense:
- **Never read `businessId` from `req.query` or `req.body` to authorize a tenant action**.
- Always extract `businessId` from the verified session / JWT token (`req.user.activeBusinessId`).
- Use the `tenantScopeGuard` middleware on all tenant routes.

---

## 💣 4. Non-Idempotent Recurring BullMQ Subscription Jobs

### The Problem:
A daily BullMQ cron job runs at 04:00 AM to generate today's deliveries from recurring subscriptions. If Redis restarts or the worker experiences a temporary network blip, the job runs twice, resulting in double orders, duplicate delivery assignments, and enraged customers.

### The Invariant & Defense:
- Use deterministic BullMQ `jobId`:
  ```typescript
  jobId: `sub-dispatch-${subscriptionId}-${format(new Date(), 'yyyy-MM-dd')}`
  ```
- BullMQ automatically deduplicates jobs with identical IDs within the queue retention window.
- In the database, enforce unique constraint: `@@unique([subscriptionId, scheduledDate])`.

---

## 💣 5. JavaScript Floating-Point Financial Rounding

### The Problem:
Using JavaScript `0.1 + 0.2` or database `FLOAT` causes fractional cent errors (`$19.9999999997`) that cascade into reconciliation mismatches between driver cash collected and bank deposits.

### The Invariant & Defense:
- In Prisma, always define financial fields as `@db.Decimal(12, 2)`.
- In TypeScript, perform calculations using `Prisma.Decimal` or integer minor units (paisa/cents).

---

## 💣 6. Negative Inventory During Concurrent Dispatch

### The Problem:
A depot has 15 full 19L bottles in stock. Two dispatchers simultaneously assign 10 bottles each to two different drivers. If stock checks are non-atomic, inventory drops to `-5`.

### The Invariant & Defense:
- Use database transactions with pessimistic locks or atomic update checks:
  ```typescript
  const updated = await tx.inventory.updateMany({
    where: {
      businessId,
      branchId,
      productId,
      fullQuantity: { gte: quantityToDeduct }
    },
    data: {
      fullQuantity: { decrement: quantityToDeduct }
    }
  });
  if (updated.count === 0) {
    throw new AppError('Insufficient stock available for dispatch', 400, 'INSUFFICIENT_STOCK');
  }
  ```

---

## 💣 7. Driver End-of-Day Cash Reconciliation Blindspot

### The Problem:
A driver marks an order as delivered and says they collected \$50 cash on delivery, but never hands the physical cash over to the cashier or accountant.

### The Invariant & Defense:
- Two-step payment status:
  1. `COLLECTED_BY_DRIVER`: Driver has marked cash as collected in the mobile app.
  2. `RECONCILED_BY_CASHIER`: Accountant confirms physical receipt of cash at the depot during evening shift closeout.


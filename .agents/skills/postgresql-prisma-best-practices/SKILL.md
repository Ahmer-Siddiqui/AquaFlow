---
name: postgresql-prisma-best-practices
description: "Expert guidelines for designing PostgreSQL schemas, Prisma ORM models, relations, compound indexes, database transactions, migrations, and Decimal monetary formatting in AquaFlow."
metadata:
  author: aquaflow-architect
  version: "1.0.0"
---

# PostgreSQL & Prisma ORM Best Practices (AquaFlow)

Use this skill whenever modifying `prisma/schema.prisma`, running database migrations, writing Prisma transactions, or handling financial/decimal calculations.

---

## 🐘 1. Relational Modeling Rules

1. **Explicit Foreign Key Constraints**:
   - Always define explicit `@relation` attributes with appropriate `onDelete: Restrict` or `onDelete: Cascade`.
   - Never allow accidental cascade deletion of financial records (`Payment`, `Invoice`, `BottleLedgerEntry`).

2. **Money and Balances**:
   - Always use `@db.Decimal(12, 2)` for prices, deposits, taxes, fees, and balances.
   - Example:
     ```prisma
     unitPrice       Decimal  @db.Decimal(12, 2)
     depositAmount   Decimal  @default(0.00) @db.Decimal(12, 2)
     outstandingBal  Decimal  @default(0.00) @db.Decimal(12, 2)
     ```

3. **Multi-Tenant Indexes**:
   - Always pair `businessId` with frequent filter/sort columns:
     ```prisma
     @@index([businessId, status])
     @@index([businessId, createdAt])
     @@index([businessId, customerId])
     ```

---

## 🔒 2. Transaction Safety

When executing operations that impact multiple models (e.g. Completing a delivery -> updating order status -> logging cash payment -> recording bottle ledger entries -> updating stock):

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. Update delivery status
  // 2. Insert BottleLedgerEntry
  // 3. Update customer bottle balances
  // 4. Create Payment record if cash collected
  // 5. Decrement full bottle inventory, increment empty bottle inventory
}, {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable // or RepeatableRead
});
```

---

## 🛡️ 3. Safe Migrations

- Always review generated SQL with `npx prisma migrate dev --create-only`.
- Never execute destructive migrations without checking backward compatibility.


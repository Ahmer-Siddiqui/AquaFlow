# Rule 08: PostgreSQL, Prisma ORM & Multi-Tenancy Best Practices

## 🐘 1. PostgreSQL Relational Design Principles

1. **UUID vs Serial Keys**:
   - Use `UUID` (`@default(uuid())`) for all core business entities (`Business`, `User`, `Customer`, `Order`, `Payment`, `Delivery`, `Subscription`, `Invoice`) to prevent enumeration attacks.
   - Use sequential IDs (`orderNumber`, `invoiceNumber`) with tenant prefixes for human readability (e.g. `AQ-2026-00014`).

2. **Compound Indexing for Multi-Tenancy**:
   - Every tenant query filters by `businessId`.
   - Always create compound indexes matching query patterns:
     - `@@index([businessId, status])`
     - `@@index([businessId, createdAt])`
     - `@@index([businessId, customerId])`
     - `@@unique([businessId, sku])`
     - `@@unique([businessId, email])`

3. **Financial Precision**:
   - Use `Decimal(12, 2)` or integer minor units (paisa/cents) for prices, taxes, discounts, delivery fees, and bottle deposits.
   - Never use JavaScript `Number` or database `Float` for money.

---

## 🔒 2. Multi-Tenant Scoping & Row Level Security (RLS)

1. **Prisma Client Extensions / Tenant Middleware**:
   - Implement a Prisma client extension or tenant query filter that injects `where: { businessId }` into all read and write queries.
2. **PostgreSQL RLS**:
   - Table definition includes:
     ```sql
     ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation_policy ON "Order"
       USING (business_id = current_setting('app.current_business_id', true)::uuid);
     ```
3. **Transaction Safety**:
   - Use `prisma.$transaction(async (tx) => { ... })` for all multi-table mutations (e.g., placing an order, dispatching delivery, completing delivery with bottle return and cash collection).


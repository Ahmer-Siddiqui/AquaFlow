# Module 02: SaaS Plans & Platform Subscription Billing

## 🎯 Domain Scope & Objectives
Empower Super Admins to manage platform subscription tiers (Free Trial, Starter, Professional, Enterprise), enforce usage quotas per water business, and handle platform subscription renewal and expiration.

---

## 🗄️ Relational Entities

### `SaaSPlan`
- `id`: UUID (Primary Key)
- `name`: String (e.g., "Free Trial", "Starter", "Professional", "Enterprise")
- `slug`: String (Unique)
- `description`: String
- `monthlyPrice`: Decimal (12, 2)
- `yearlyPrice`: Decimal (12, 2)
- `maxUsers`: Integer
- `maxCustomers`: Integer
- `maxBranches`: Integer
- `features`: JSONB (Module flags: `{ "accounting": true, "automatedSubscriptions": true, "smsAlerts": false }`)
- `isActive`: Boolean

### `BusinessSubscription`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id, Unique)
- `planId`: UUID (FK -> SaaSPlan.id)
- `status`: Enum (`TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`)
- `startDate`: DateTime
- `endDate`: DateTime
- `trialEndsAt`: DateTime (Optional)
- `cancelledAt`: DateTime (Optional)

---

## 🔒 Business Invariants
1. A business cannot add more branches, staff members, or customers than allowed by their active `SaaSPlan` tier.
2. If a business subscription is `EXPIRED` or `CANCELLED`, operational writes are blocked with a `403 Payment Required (PLAN_UPGRADE_REQUIRED)` error while read access is preserved.
3. SaaS platform billing is strictly decoupled from the individual water business's customer invoices.


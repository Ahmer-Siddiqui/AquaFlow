# Module 03: Businesses, Branches & Multi-Tenancy Management

## 🎯 Domain Scope & Objectives
Manage tenant onboarding, business profiles, customized branding, operational settings, delivery charges, bottle deposit rates, working hours, and physical branch / depot networks.

---

## 🗄️ Relational Entities

### `Business`
- `id`: UUID (Primary Key)
- `name`: String
- `slug`: String (Unique)
- `logoUrl`: String (Optional)
- `email`: String
- `phone`: String
- `currency`: String (Default: "PKR" or "USD")
- `address`: String
- `city`: String
- `deliveryFeeStandard`: Decimal (12, 2)
- `bottleDepositRate19L`: Decimal (12, 2)
- `bottleDepositRate12L`: Decimal (12, 2)
- `status`: Enum (`PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`)
- `workingHours`: JSONB (`{ "monday": { "open": "08:00", "close": "20:00" }, ... }`)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `Branch`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `name`: String (e.g. "Main Bottling Plant", "North Zone Depot")
- `code`: String (e.g. "DEP-01")
- `address`: String
- `phone`: String
- `latitude`: Float (Optional)
- `longitude`: Float (Optional)
- `isActive`: Boolean (Default: true)

---

## 🔒 Business Invariants
1. `Business.slug` must be globally unique and URL-safe.
2. Every business MUST have at least one primary `Branch`.
3. Deleting a business is a soft delete (`status: SUSPENDED`) to preserve historical accounting and bottle liability records.


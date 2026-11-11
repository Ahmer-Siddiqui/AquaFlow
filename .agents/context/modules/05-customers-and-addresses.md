# Module 05: Customers, Addresses & Balances

## 🎯 Domain Scope & Objectives
Manage customer profiles (residential households, corporate offices, schools), multiple delivery locations with GPS pins, bottle balances, deposit balances, and outstanding financial credits.

---

## 🗄️ Relational Entities

### `Customer`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `userId`: UUID (FK -> User.id, Optional if customer created manually by phone/walk-in)
- `customerType`: Enum (`RESIDENTIAL`, `COMMERCIAL`, `INSTITUTIONAL`)
- `companyName`: String (Optional)
- `displayName`: String
- `phone`: String
- `email`: String (Optional)
- `bottleBalance`: Integer (Default: 0) — Cached net full bottles in customer possession
- `depositBalance`: Decimal (12, 2) — Cached total deposit money held for this customer
- `outstandingBalance`: Decimal (12, 2) — Unpaid credit balance owed to business
- `status`: Enum (`ACTIVE`, `INACTIVE`, `BLACKLISTED`)
- `internalNotes`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `Address`
- `id`: UUID (Primary Key)
- `customerId`: UUID (FK -> Customer.id)
- `label`: String (e.g. "Home", "Floor 3 Office", "Warehouse")
- `street`: String
- `building`: String (Optional)
- `floor`: String (Optional)
- `area`: String
- `city`: String
- `latitude`: Float (Optional, for route optimization)
- `longitude`: Float (Optional, for route optimization)
- `deliveryInstructions`: String (Optional, e.g. "Ring gate bell twice")
- `isDefault`: Boolean (Default: false)

---

## 🔒 Invariants
1. `phone` must be unique per business (`@@unique([businessId, phone])`).
2. Cached balances (`bottleBalance`, `depositBalance`) must strictly match the aggregated sum from `BottleLedgerEntry`.


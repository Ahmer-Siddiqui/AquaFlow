# Module 06: Products, Categories & Pricing

## 🎯 Domain Scope & Objectives
Manage the product catalog: 19L, 12L, and 6L purified water bottles, dispensers, pumps, bottle caps, and custom business pricing rules.

---

## 🗄️ Relational Entities

### `Category`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `name`: String (e.g. "Standard Water Bottles", "Dispenser Equipment", "Accessories")
- `slug`: String
- `description`: String (Optional)
- `displayOrder`: Integer (Default: 0)

### `Product`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `categoryId`: UUID (FK -> Category.id)
- `name`: String (e.g. "19L Mineral Water Refill", "19L New Bottle + Deposit", "Electric Water Dispenser")
- `sku`: String
- `sizeLiters`: Decimal (5, 2) (e.g. 19.00, 12.00, 6.00, 0.00)
- `isReturnableBottle`: Boolean (True for 19L/12L bottles requiring empty bottle tracking)
- `sellingPrice`: Decimal (12, 2) (Price for the water refill or accessory)
- `depositPrice`: Decimal (12, 2) (Bottle security deposit charged on new empty bottle issuance)
- `costPrice`: Decimal (12, 2) (Internal purification/production cost for margin analysis)
- `imageUrl`: String (Optional)
- `description`: String (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime
- `updatedAt`: DateTime

---

## 🔒 Invariants
1. `sku` must be unique per business (`@@unique([businessId, sku])`).
2. When `isReturnableBottle` is true, completing an order must interact with the **Bottle Ledger**.
3. Selling price and deposit price cannot be negative.


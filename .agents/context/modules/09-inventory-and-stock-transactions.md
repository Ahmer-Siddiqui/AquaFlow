# Module 09: Inventory & Stock Transactions

## 🎯 Domain Scope & Objectives
Track stock levels across branches/depots with distinct physical categories (Full Bottles, Empty Bottles awaiting sanitization/refilling, Damaged Bottles, Non-returnable merchandise), branch transfers, and atomic stock updates.

---

## 🗄️ Relational Entities

### `Inventory`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `branchId`: UUID (FK -> Branch.id)
- `productId`: UUID (FK -> Product.id)
- `fullQuantity`: Integer (Default: 0) — Ready for delivery
- `emptyQuantity`: Integer (Default: 0) — Clean/dirty empty bottles in depot
- `damagedQuantity`: Integer (Default: 0) — Cracked/scratched bottles awaiting scrap/recycle
- `lowStockThreshold`: Integer (Default: 20)
- `updatedAt`: DateTime
- `@@unique([branchId, productId])`

### `StockTransaction`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `branchId`: UUID (FK -> Branch.id)
- `productId`: UUID (FK -> Product.id)
- `transactionType`: Enum:
  - `PRODUCTION_FILL` (Bottles filled from purification line)
  - `DELIVERY_DISPATCH` (Full bottles loaded onto delivery vehicle)
  - `DELIVERY_RETURN` (Empty bottles unloaded from delivery vehicle)
  - `BRANCH_TRANSFER_OUT` (Transferred to another branch)
  - `BRANCH_TRANSFER_IN` (Received from another branch)
  - `SCRAP_DAMAGED` (Bottles discarded due to cracks)
  - `MANUAL_ADJUSTMENT` (Periodic audit count correction)
- `bottleState`: Enum (`FULL`, `EMPTY`, `DAMAGED`)
- `quantity`: Integer (Positive or negative change)
- `resultingQuantity`: Integer
- `reason`: String (Optional)
- `performedById`: UUID (FK -> User.id)
- `createdAt`: DateTime

---

## 🔒 Invariants
1. `fullQuantity` cannot become negative unless explicitly configured in `Business.settings.allowNegativeInventory`.
2. Inter-branch stock transfers must be executed inside a single database transaction (`BRANCH_TRANSFER_OUT` from Source + `BRANCH_TRANSFER_IN` into Destination).


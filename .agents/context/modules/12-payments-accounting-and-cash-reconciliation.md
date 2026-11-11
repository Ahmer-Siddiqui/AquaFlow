# Module 12: Payments, Accounting & Cash Reconciliation

## 🎯 Domain Scope & Objectives
Manage multi-channel payments (Cash on Delivery, Easypaisa, JazzCash, Bank Transfer), driver end-of-day cash settlements, operating expense tracking, customer credit ledgers, and Profit & Loss (P&L) statements.

---

## 🗄️ Relational Entities

### `Payment`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `orderId`: UUID (Optional, FK -> Order.id)
- `customerId`: UUID (FK -> Customer.id)
- `amount`: Decimal (12, 2)
- `paymentMethod`: Enum (`CASH`, `BANK_TRANSFER`, `EASYPAISA`, `JAZZCASH`, `CARD`)
- `status`: Enum (`PENDING_VERIFICATION`, `COLLECTED_BY_DRIVER`, `RECONCILED`, `FAILED`, `REFUNDED`)
- `referenceNumber`: String (Optional transaction ref or bank receipt ID)
- `collectedByDriverId`: UUID (Optional, FK -> User.id)
- `reconciledById`: UUID (Optional, FK -> User.id)
- `reconciledAt`: DateTime (Optional)
- `createdAt`: DateTime

### `Expense`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `branchId`: UUID (FK -> Branch.id)
- `category`: Enum (`FUEL_AND_MAINTENANCE`, `RAW_WATER_PURCHASE`, `ELECTRICITY_UTILITIES`, `STAFF_SALARY`, `PLANT_CHEMICALS_FILTERS`, `OFFICE_SUPPLIES`, `OTHER`)
- `amount`: Decimal (12, 2)
- `description`: String
- `receiptUrl`: String (Optional)
- `recordedById`: UUID (FK -> User.id)
- `expenseDate`: DateTime
- `createdAt`: DateTime

---

## 📊 Accounting & Financial Reports
- **Revenue Recognition**:
  - Net Sales = Water bottle refills + Accessories sold + Delivery fees.
  - Exclude bottle deposits (deposits are recorded as balance sheet liabilities, not P&L revenue).
- **Cost of Goods Sold (COGS)**: Raw water + purification chemicals + replacement bottle caps + production labor.
- **Gross Profit**: Net Sales - COGS.
- **Operating Expenses**: Fuel, vehicle repairs, electricity, depot rent.
- **Net Profit**: Gross Profit - Operating Expenses.


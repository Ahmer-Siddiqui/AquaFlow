# Module 08: Empty Bottle Ledger & Deposit Accounting

## 🎯 Domain Scope & Objectives
Track every physical movement of full, empty, and damaged returnable bottles (19L, 12L) through an immutable, auditable double-entry ledger. Ensure zero lost bottles and strict customer deposit reconciliation.

---

## 🗄️ Relational Entities

### `BottleLedgerEntry`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `customerId`: UUID (FK -> Customer.id)
- `orderId`: UUID (Optional, FK -> Order.id)
- `deliveryId`: UUID (Optional, FK -> Delivery.id)
- `productId`: UUID (FK -> Product.id)
- `transactionType`: Enum:
  - `DELIVERY_ISSUANCE` (Full bottles delivered to customer)
  - `DELIVERY_RETURN` (Empty bottles collected from customer)
  - `DAMAGED_RETURN` (Customer returned cracked/damaged bottle)
  - `DEPOSIT_PAID` (Customer paid new security deposit)
  - `DEPOSIT_REFUNDED` (Deposit returned to customer in cash/credit)
  - `AUDIT_CORRECTION` (Manager reconciliation with audited reason)
- `fullDelivered`: Integer (Default: 0)
- `emptyReturned`: Integer (Default: 0)
- `damagedCount`: Integer (Default: 0)
- `depositAmount`: Decimal (12, 2) (Default: 0.00)
- `refundAmount`: Decimal (12, 2) (Default: 0.00)
- `runningBottleBalance`: Integer (Customer balance after this entry)
- `runningDepositBalance`: Decimal (12, 2) (Customer deposit balance after this entry)
- `performedById`: UUID (FK -> User.id)
- `notes`: String (Optional)
- `createdAt`: DateTime (Immutable)

---

## 🔒 The Bottle Accounting Formula

For any customer at any point in time:
$$\text{Outstanding Bottles} = \sum \text{fullDelivered} - \sum \text{emptyReturned} - \sum \text{damagedCount}$$
$$\text{Held Deposit} = \sum \text{depositAmount} - \sum \text{refundAmount}$$

### Mathematical Invariants:
1. **Never directly overwrite `Customer.bottleBalance`**: Every balance change MUST be accompanied by an inserted row in `BottleLedgerEntry`.
2. **Excess Bottle Returns Guard**: A customer cannot return more empty bottles than their historical net issued balance, unless a `BUSINESS_OWNER` or `MANAGER` explicitly passes an audited override reason.
3. **Damaged Bottles**: When a bottle is marked damaged, it does not credit the empty bottle return for full deposit refund unless business policy allows partial refund.


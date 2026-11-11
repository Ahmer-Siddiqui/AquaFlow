# Module 07: Orders & Invoicing Engine

## 🎯 Domain Scope & Objectives
Manage customer cart checkout, order placement, the 8-stage order lifecycle, immutable historical price snapshots, and automatic invoice generation.

---

## 🗄️ Relational Entities

### `Order`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `branchId`: UUID (FK -> Branch.id)
- `customerId`: UUID (FK -> Customer.id)
- `addressId`: UUID (FK -> Address.id)
- `orderNumber`: String (Unique human-friendly sequence, e.g. `ORD-2026-00451`)
- `status`: Enum (`PENDING`, `CONFIRMED`, `PROCESSING`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `CANCELLED`)
- `subtotal`: Decimal (12, 2)
- `depositTotal`: Decimal (12, 2)
- `deliveryFee`: Decimal (12, 2)
- `discountAmount`: Decimal (12, 2)
- `totalAmount`: Decimal (12, 2)
- `paymentStatus`: Enum (`PENDING`, `PARTIALLY_PAID`, `PAID`, `REFUNDED`)
- `paymentMethod`: Enum (`CASH_ON_DELIVERY`, `ONLINE_GATEWAY`, `BANK_TRANSFER`, `EASYPAISA`, `JAZZCASH`)
- `scheduledDate`: DateTime
- `preferredTimeSlot`: String (e.g., "09:00 - 12:00", "14:00 - 17:00")
- `customerNotes`: String (Optional)
- `cancelledReason`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `OrderItem`
- `id`: UUID (Primary Key)
- `orderId`: UUID (FK -> Order.id)
- `productId`: UUID (FK -> Product.id)
- `quantity`: Integer
- `unitPrice`: Decimal (12, 2) (Immutable snapshot at purchase time)
- `unitDeposit`: Decimal (12, 2) (Immutable snapshot at purchase time)
- `totalPrice`: Decimal (12, 2)
- `isReturnExpected`: Boolean (True if customer is expected to return empty bottles)

### `Invoice`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `orderId`: UUID (FK -> Order.id, Unique)
- `invoiceNumber`: String (e.g. `INV-2026-00451`)
- `subtotal`: Decimal (12, 2)
- `depositAmount`: Decimal (12, 2)
- `deliveryFee`: Decimal (12, 2)
- `totalAmount`: Decimal (12, 2)
- `paidAmount`: Decimal (12, 2) (Default: 0.00)
- `status`: Enum (`ISSUED`, `PAID`, `VOIDED`, `OVERDUE`)
- `issuedAt`: DateTime
- `dueDate`: DateTime

---

## 🔒 8-Stage Order Lifecycle Invariants

```text
[PENDING] ──► [CONFIRMED] ──► [PROCESSING] ──► [ASSIGNED] ──► [OUT_FOR_DELIVERY] ──► [DELIVERED]
    │              │                │               │                  │
    ▼              ▼                ▼               ▼                  ▼
[CANCELLED]    [CANCELLED]      [CANCELLED]     [CANCELLED]        [FAILED]
```

1. **Immutable Price Snapshots**: Never re-calculate order total based on current product prices. The prices at time of order creation are frozen in `OrderItem`.
2. **Cannot cancel delivered orders**: Once marked `DELIVERED`, an order cannot transition to `CANCELLED`. Corrections must be executed via credit note or return ledger entry.


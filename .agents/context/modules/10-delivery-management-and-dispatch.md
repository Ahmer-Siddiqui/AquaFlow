# Module 10: Delivery Management & Field Dispatch

## 🎯 Domain Scope & Objectives
Empower operations managers to organize daily delivery runs, assign delivery drivers, and provide delivery staff with a specialized mobile-optimized interface for route navigation, OTP confirmation, cash collection, and empty bottle return recording.

---

## 🗄️ Relational Entities

### `Delivery`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `branchId`: UUID (FK -> Branch.id)
- `orderId`: UUID (FK -> Order.id, Unique)
- `driverId`: UUID (FK -> User.id)
- `scheduledDate`: DateTime
- `stopOrder`: Integer (Route sequence number, 1..N)
- `status`: Enum (`ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `CANCELLED`)
- `otpCode`: String (4 or 6 digit verification code generated at dispatch)
- `otpVerified`: Boolean (Default: false)
- `proofPhotoUrl`: String (Optional photo of bottles left at customer porch/office)
- `cashCollected`: Decimal (12, 2) (Default: 0.00)
- `emptyBottlesCollected`: Integer (Default: 0)
- `customerNotes`: String (Optional)
- `failureReason`: String (Optional, e.g. "Customer gate locked", "Wrong address", "No cash available")
- `dispatchedAt`: DateTime (Optional)
- `deliveredAt`: DateTime (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

---

## 🔒 Delivery Execution Invariants
1. When a delivery transitions to `DELIVERED`:
   - `Order.status` automatically transitions to `DELIVERED`.
   - `BottleLedgerEntry` is automatically appended with `fullDelivered` (from order items) and `emptyReturned` (recorded by driver).
   - If `cashCollected > 0`, a `Payment` record with status `COLLECTED_BY_DRIVER` is created.
   - Branch inventory is updated atomically.
2. A real-time WebSocket event (`delivery:status_changed`) is emitted to the tenant room and customer channel.


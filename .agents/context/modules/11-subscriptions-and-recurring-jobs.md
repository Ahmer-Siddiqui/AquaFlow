# Module 11: Recurring Subscriptions & BullMQ Dispatch Engine

## 🎯 Domain Scope & Objectives
Allow residential and commercial water consumers to set recurring delivery schedules (daily, alternate days, weekly, custom days of week) and automatically generate dispatch orders via BullMQ queue workers.

---

## 🗄️ Relational Entities

### `Subscription`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `customerId`: UUID (FK -> Customer.id)
- `addressId`: UUID (FK -> Address.id)
- `frequency`: Enum (`DAILY`, `ALTERNATE_DAYS`, `WEEKLY`, `BIWEEKLY`, `MONTHLY_QUOTA`, `CUSTOM_DAYS`)
- `customDays`: Integer[] (e.g. `[1, 3, 5]` for Mon, Wed, Fri)
- `status`: Enum (`ACTIVE`, `PAUSED`, `CANCELLED`)
- `startDate`: DateTime
- `nextDeliveryDate`: DateTime
- `preferredTimeSlot`: String (e.g. "08:00 - 11:00")
- `paymentPreference`: Enum (`CASH_ON_DELIVERY`, `MONTHLY_INVOICE`, `PREPAID_WALLET`)
- `pausedUntil`: DateTime (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `SubscriptionItem`
- `id`: UUID (Primary Key)
- `subscriptionId`: UUID (FK -> Subscription.id)
- `productId`: UUID (FK -> Product.id)
- `quantity`: Integer (Default: 1)

---

## ⏰ BullMQ Scheduled Dispatch Worker Rules

1. **Cron Schedule**: Runs daily at 00:30 AM (depot local time) to generate orders for `scheduledDate = today`.
2. **Deterministic Idempotency**:
   - Job ID format: `sub-order-${subscription.id}-${format(scheduledDate, 'yyyy-MM-dd')}`.
   - Enforce database constraint `@@unique([subscriptionId, scheduledDate])` on generated orders.
3. **Skipping Logic**:
   - Skip if `subscription.status === 'PAUSED'` or `pausedUntil > today`.
   - Skip if customer is `BLACKLISTED` or has exceeded credit limits.
   - Advance `nextDeliveryDate` according to frequency cadence.


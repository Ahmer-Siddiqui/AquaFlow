# Module 13: In-App Notifications & Real-Time Socket.IO Channels

## 🎯 Domain Scope & Objectives
Provide instant in-app alerts and live WebSocket updates across all 4 AquaFlow panels for delivery dispatches, order status transitions, low-stock warnings, and payment reconciliations.

---

## 🗄️ Relational Entities

### `Notification`
- `id`: UUID (Primary Key)
- `userId`: UUID (FK -> User.id)
- `businessId`: UUID (Optional, FK -> Business.id)
- `type`: Enum:
  - `ORDER_CREATED`
  - `ORDER_CONFIRMED`
  - `DELIVERY_DISPATCHED`
  - `DELIVERY_COMPLETED`
  - `BOTTLE_DEPOSIT_REFUNDED`
  - `PAYMENT_RECEIVED`
  - `LOW_STOCK_ALERT`
  - `SUBSCRIPTION_RENEWAL`
- `title`: String
- `message`: String
- `link`: String (Optional relative URL in UI)
- `isRead`: Boolean (Default: false)
- `createdAt`: DateTime

---

## ⚡ Socket.IO Room Topology & Events

### Rooms:
- `tenant:${businessId}`: Business managers, dispatchers, accountants.
- `driver:${driverUserId}`: Private channel for individual delivery staff.
- `customer:${customerUserId}`: Private channel for end consumers.

### Live Events Emitted:
1. `order:new`: Broadcast to `tenant:${businessId}` when customer places an order.
2. `delivery:out`: Broadcast to `customer:${userId}` when driver starts delivery route.
3. `delivery:completed`: Broadcast to both `tenant:${businessId}` and `customer:${userId}` with bottle and cash summary.
4. `inventory:low_stock`: Emitted to `tenant:${businessId}` when full bottle quantity drops below branch threshold.


# Module 04: Users, Memberships & Granular RBAC

## 🎯 Domain Scope & Objectives
Manage staff invitations, employee profiles, roles, and fine-grained permissions within each water supply business.

---

## 🗄️ Relational Entities

### `Membership`
- `id`: UUID (Primary Key)
- `userId`: UUID (FK -> User.id)
- `businessId`: UUID (FK -> Business.id)
- `role`: Enum (`BUSINESS_OWNER`, `MANAGER`, `ACCOUNTANT`, `DELIVERY_STAFF`, `CUSTOMER`)
- `branchId`: UUID (Optional, FK -> Branch.id, for branch-restricted staff)
- `status`: Enum (`INVITED`, `ACTIVE`, `SUSPENDED`)
- `invitedBy`: UUID (FK -> User.id)
- `joinedAt`: DateTime
- `createdAt`: DateTime

### `RolePermission`
- `id`: UUID (Primary Key)
- `businessId`: UUID (FK -> Business.id)
- `role`: Enum
- `permission`: String (e.g., `orders:view`, `orders:create`, `orders:assign`, `bottles:adjust`, `finance:record-expense`)

---

## 🔒 Permission Matrix
- **BUSINESS_OWNER**: Unrestricted access to tenant settings, finances, employees, and operations.
- **MANAGER**: Full operational access (orders, stock, dispatch, drivers, customers), but restricted from viewing business owner profit/loss accounts or editing SaaS plans.
- **ACCOUNTANT**: Access to payments, expenses, invoice generation, customer credit balances, and cash-on-delivery reconciliation.
- **DELIVERY_STAFF**: Access limited to assigned deliveries, driver dashboard, delivery completion, and cash/bottle collection recording.
- **CUSTOMER**: Access strictly confined to own orders, own addresses, own bottle balance, and recurring subscriptions.


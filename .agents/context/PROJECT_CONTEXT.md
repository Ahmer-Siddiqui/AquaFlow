# AquaFlow — Master Project Context & Architectural Blueprint

## 🌐 1. Project Overview & Scope

**AquaFlow (`aquaflow`)** is an enterprise-grade, multi-tenant **Water Supply and Distribution Management SaaS Platform**. The platform powers bottled water purification, filling, and logistics companies delivering filtered drinking water in:
- **19-Liter (5 Gallon) Polycarbonate Bottles**
- **12-Liter Polycarbonate Bottles**
- **6-Liter Polyethylene Bottles**
- **Water Dispensers, Manual/Electric Pumps, Racks, and Bottle Caps**

### Key Platform Interfaces:
1. **Super Admin Panel (`/admin`)**: Multi-tenant SaaS oversight, tenant subscription management, billing tiers, global telemetry.
2. **Business Admin Panel (`/business`)**: Water plant operations, product catalog, branch & depot management, order dispatch, inventory, bottle ledger, accounting, and reports.
3. **Delivery Staff Panel (`/delivery`)**: Mobile-first field driver web app for daily route execution, customer phone/address/GPS, delivery completion, OTP verification, cash collection, and empty bottle return logging.
4. **Customer Portal (`/portal`)**: Residential and commercial water consumer interface for one-time bottle orders, recurring delivery plans (subscriptions), bottle deposit balances, and billing history.

---

## 🏛️ 2. Architectural Structure & Stack

### Technology Matrix
- **Runtime & Language**: Node.js (v20+ LTS) with TypeScript 5.x (ESM, Target ES2022, NodeNext)
- **Framework**: Express.js 4.x / 5.x with RESTful `/api/v1` architecture
- **Database & ORM**: PostgreSQL 16+ with Prisma ORM 5.x / 6.x
- **Multi-Tenancy**: Shared database, shared schema with tenant scoping (`businessId`), compound indexes, and PostgreSQL Row Level Security (RLS)
- **Caching & Job Queue**: Redis 7+ and BullMQ (for recurring subscription dispatch, notification jobs, and daily schedule generation)
- **Real-Time Communication**: Socket.IO (for live delivery status updates, driver location pings, and dispatch alerts)
- **Validation**: Zod 3.x schemas for all incoming HTTP payloads (body, query, params)
- **Security & Auth**: Argon2 / bcrypt password hashing, JWT access tokens, refresh token rotation with secure HTTP-only cookies, and granular RBAC
- **Testing**: Vitest, Supertest, and Playwright for E2E
- **Documentation**: Swagger / OpenAPI 3.0 specification
- **Frontend**: React.js 18+, TypeScript 5.x, Vite, Tailwind CSS, shadcn/ui, Redux Toolkit, TanStack Query v5, React Hook Form, Zod, Recharts

### 4-Tier Modular Clean Architecture Blueprint
```text
backend/src/
├── config/              # Environment variables, database connection, redis, logger
├── core/                # DI Container (container.ts), base repository, base service
│   ├── IRepositories/   # Base repository contracts
│   ├── IServices/       # Base service contracts
│   ├── dtos/            # Shared DTOs (pagination, date ranges)
│   └── container.ts     # Central Composition Root & DI Wiring
├── middlewares/         # auth, tenantScope, roleGuard, validate(zod), errorHandler
├── modules/             # Domain-driven modular monolith modules
│   ├── auth/            # Registration, login, refresh tokens, password reset
│   ├── users/           # User profiles, system accounts
│   ├── businesses/      # Multi-tenant business profiles, settings, branding
│   ├── memberships/     # User-to-Business associations and role mappings
│   ├── customers/       # Customer profiles, delivery addresses, bottle & deposit balances
│   ├── products/        # Bottle sizes (19L, 12L, 6L), accessories, pricing, categories
│   ├── orders/          # Cart, order creation, 8-stage order lifecycle, price snapshots
│   ├── bottle-ledger/   # Immutable bottle ledger: full delivered, empty returned, deposits
│   ├── inventory/       # Stock tracking: full/empty/damaged bottles, branch transfers
│   ├── deliveries/      # Route dispatch, driver assignment, OTP verification, cash logs
│   ├── subscriptions/   # Recurring delivery schedules (daily, weekly, custom) via BullMQ
│   ├── payments/        # Cash-on-delivery, Easypaisa, JazzCash, bank transfer, refunds
│   ├── accounting/      # Invoices, expense logging, revenue reports, P&L statements
│   ├── notifications/   # In-app notifications & Socket.IO real-time delivery alerts
│   └── billing/         # SaaS platform plans, business subscriptions, trial periods
├── jobs/                # BullMQ queue definitions, workers, and schedulers
├── sockets/             # Socket.IO connection handlers and real-time events
└── utils/               # AppError, ApiResponse, Decimal math, JWT, Hash helpers
```

---

## 🗄️ 3. Complete Database Models & Schema Dictionary

The database consists of 24 normalized relational models defined in PostgreSQL via Prisma:

| Model | Schema File | Purpose & Key Relations |
| :--- | :--- | :--- |
| `User` | `schema.prisma` | Global user identity (`email`, `phone`, `passwordHash`, `isSuperAdmin`, `avatarUrl`) |
| `Business` | `schema.prisma` | Water business tenant (`name`, `slug`, `logoUrl`, `phone`, `address`, `currency`, `settings`) |
| `Membership` | `schema.prisma` | Association connecting `User` to `Business` with assigned `Role` |
| `Role` | `schema.prisma` | RBAC roles (`SUPER_ADMIN`, `BUSINESS_OWNER`, `MANAGER`, `ACCOUNTANT`, `DELIVERY_STAFF`, `CUSTOMER`) |
| `Permission` | `schema.prisma` | Granular capability flags (e.g., `orders:create`, `bottles:override`, `finance:view`) |
| `Branch` | `schema.prisma` | Business depot/filling plant/branch location (`businessId`, `name`, `code`, `address`, `phone`) |
| `Customer` | `schema.prisma` | Water consumer profile (`businessId`, `userId`, `customerType`, `bottleBalance`, `depositBalance`, `outstandingBalance`) |
| `Address` | `schema.prisma` | Customer delivery locations (`customerId`, `label`, `street`, `area`, `latitude`, `longitude`, `isDefault`) |
| `Category` | `schema.prisma` | Product grouping (`businessId`, `name`, `description`, `icon`) |
| `Product` | `schema.prisma` | Water item (`businessId`, `categoryId`, `name`, `sizeLiters`, `sellingPrice`, `depositPrice`, `costPrice`, `sku`) |
| `Order` | `schema.prisma` | Order record (`businessId`, `branchId`, `customerId`, `orderNumber`, `status`, `totalAmount`, `depositTotal`, `paymentStatus`) |
| `OrderItem` | `schema.prisma` | Immutable snapshot of purchased item (`orderId`, `productId`, `quantity`, `unitPrice`, `unitDeposit`, `totalPrice`) |
| `BottleLedgerEntry` | `schema.prisma` | Immutable bottle tracking (`businessId`, `customerId`, `orderId`, `deliveryId`, `fullDelivered`, `emptyReturned`, `damagedCount`, `depositAmount`, `refundAmount`) |
| `Inventory` | `schema.prisma` | Stock per branch (`businessId`, `branchId`, `productId`, `fullQuantity`, `emptyQuantity`, `damagedQuantity`, `lowStockThreshold`) |
| `StockTransaction`| `schema.prisma` | Audit trail of stock movements (`businessId`, `branchId`, `productId`, `transactionType`, `quantity`, `reference`) |
| `Delivery` | `schema.prisma` | Delivery dispatch run (`businessId`, `branchId`, `orderId`, `driverId`, `status`, `scheduledDate`, `otpCode`, `cashCollected`, `emptyBottlesCollected`) |
| `Subscription` | `schema.prisma` | Recurring delivery schedule (`businessId`, `customerId`, `frequency`, `deliveryDays`, `nextDeliveryDate`, `status`) |
| `SubscriptionItem`| `schema.prisma` | Products scheduled in subscription (`subscriptionId`, `productId`, `quantity`) |
| `Payment` | `schema.prisma` | Payment transaction (`businessId`, `orderId`, `customerId`, `amount`, `paymentMethod`, `status`, `reconciledBy`) |
| `Expense` | `schema.prisma` | Operating expense (`businessId`, `branchId`, `category`, `amount`, `description`, `receiptUrl`, `recordedBy`) |
| `Invoice` | `schema.prisma` | Formal tax/billing invoice (`businessId`, `orderId`, `invoiceNumber`, `subtotal`, `taxAmount`, `totalAmount`, `status`) |
| `Notification` | `schema.prisma` | In-app user notification (`userId`, `businessId`, `title`, `message`, `type`, `isRead`, `link`) |
| `AuditLog` | `schema.prisma` | Security & compliance audit trail (`businessId`, `userId`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`) |
| `SaaSPlan` | `schema.prisma` | Platform SaaS pricing tier (`name`, `price`, `billingCycle`, `maxUsers`, `maxCustomers`, `maxBranches`, `features`) |
| `BusinessSubscription`| `schema.prisma` | Tenant's SaaS subscription (`businessId`, `planId`, `startDate`, `endDate`, `status`, `isTrial`) |

---

## 🌐 4. API Endpoints Catalog (`/api/v1`)

### A. Auth & Identity (`/api/v1/auth`)
- `POST /register`: Platform user / business registration
- `POST /login`: Email/password login with JWT access token + HTTP-only refresh cookie
- `POST /refresh-token`: Rotate refresh token & issue new access token
- `POST /logout`: Invalidate session & clear cookies
- `GET /me`: Get current authenticated user profile & active business context
- `POST /switch-business`: Change active business membership

### B. Business & Branch Management (`/api/v1/businesses`)
- `GET /`: List user's businesses
- `POST /`: Create new business profile & workspace
- `GET /:id`: Retrieve business details & settings
- `PUT /:id`: Update business settings (bottle prices, deposit rates, delivery charges, working hours)
- `POST /:id/branches`: Add a new branch or depot
- `GET /:id/branches`: List all branches for this business
- `POST /:id/invite`: Invite an employee (Manager, Accountant, Driver)

### C. Customers & Addresses (`/api/v1/customers`)
- `GET /`: List customers with search, status filters, and pagination
- `POST /`: Create customer profile
- `GET /:id`: Get customer details, bottle balance, deposit balance, outstanding balance
- `PUT /:id`: Update customer details
- `POST /:id/addresses`: Add delivery address (with GPS coordinates)
- `GET /:id/bottle-history`: View customer's complete immutable bottle ledger history

### D. Products & Catalog (`/api/v1/products`)
- `GET /`: List products (19L, 12L, 6L, accessories)
- `POST /`: Create product (selling price, cost price, deposit requirement)
- `PUT /:id`: Update product pricing and status
- `DELETE /:id`: Archive/deactivate product

### E. Orders & Lifecycle (`/api/v1/orders`)
- `POST /`: Place order (creates order items, calculates total price & required deposits)
- `GET /`: List orders with multi-parameter filtering (status, date range, branch, driver)
- `GET /:id`: Get full order details and invoice snapshot
- `PATCH /:id/status`: Transition order status (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `ASSIGNED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `CANCELLED`)
- `POST /:id/assign`: Assign delivery staff and generate delivery dispatch record

### F. Empty Bottle Ledger (`/api/v1/bottle-ledger`)
- `GET /customer/:customerId`: View customer bottle balance & history
- `POST /entries`: Record manual bottle adjustment or audited deposit refund
- `GET /reconciliation`: Business-wide bottle audit (total bottles out in market vs. total collected)

### G. Inventory Management (`/api/v1/inventory`)
- `GET /`: List stock levels per branch (Full, Empty, Damaged)
- `POST /adjust`: Stock intake / adjustment with audit reason
- `POST /transfer`: Atomic stock transfer between two branches

### H. Deliveries & Field Dispatch (`/api/v1/deliveries`)
- `GET /my-deliveries`: Driver panel endpoint for assigned daily route
- `POST /:id/start`: Mark out for delivery (triggers customer notification)
- `POST /:id/complete`: Complete delivery with OTP, cash collected, and empty bottles returned
- `POST /:id/failed`: Log failed delivery with standardized reason code

### I. Subscriptions & Recurring Orders (`/api/v1/subscriptions`)
- `POST /`: Create recurring delivery plan (daily, alternate days, weekly, custom)
- `GET /`: List subscriptions
- `PATCH /:id/pause`: Pause recurring deliveries
- `PATCH /:id/resume`: Resume recurring deliveries
- `DELETE /:id`: Cancel subscription

### J. Payments & Accounting (`/api/v1/accounting`)
- `POST /payments`: Record customer payment (Cash, Easypaisa, JazzCash, Bank)
- `GET /payments`: List payments and driver cash settlements
- `POST /expenses`: Record business operational expense
- `GET /reports/pnl`: Profit & Loss statement (Sales, Deposits, COGS, Expenses, Net Profit)

### K. SaaS Admin (`/api/v1/admin`)
- `GET /businesses`: Super Admin view of all businesses and statuses
- `PATCH /businesses/:id/status`: Approve or suspend a business
- `GET /plans`: List SaaS subscription plans
- `POST /plans`: Create / edit SaaS plan tiers
- `GET /metrics`: Global platform analytics and MRR


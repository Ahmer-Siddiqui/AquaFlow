# AquaFlow — Master Feature Implementation Checklist & Roadmap (`feature.md`)

This document serves as the single source of truth for step-by-step implementation, tracking every module, database entity, API contract, and UI panel in **AquaFlow**.

---

## 🧭 Project Status Dashboard

- **Current Phase:** Phase 0: System Architecture, Database ERD & Workspace Setup
- **Architecture Review:** Complete & Ready for Review
- **Codebase Integrity:** Modular Monolith + Feature-First React Client
- **Quality Gates:** 100% Type-Safe TypeScript, Strict Tenant Isolation, Zero Mock Data

---

## 📌 Phase-by-Phase Implementation Roadmap

### 🏗️ Phase 0: System Architecture, Database ERD & Environment Scaffolding
- [x] Analyze complete domain requirements for 19L/12L/6L water distribution SaaS
- [x] Design 4-tier Clean Architecture (Controller -> Service -> Repository -> Prisma ORM) with central DI Container
- [x] Create `.agents/` engineering brain with rules, skills, domain specs, and footgun catalog
- [x] Produce complete Database ERD with 24 relational models
- [x] Scaffold dual workspaces (`backend/` and `frontend/`) with TypeScript configs
- [x] Create master `README.md`, `ROADMAP.md`, and `feature.md`
- [ ] Initialize Git repository commits for baseline scaffolding

---

### 🔐 Phase 1: Authentication, Identity & Multi-Tenant Authorization
- **Domain Spec:** `.agents/context/modules/01-auth-and-identity.md` & `04-users-memberships-and-rbac.md`
- **Database Models:** `User`, `RefreshToken`, `Membership`, `Role`, `Permission`
- **Tasks:**
  - [ ] Configure PostgreSQL database connection and initial Prisma migration
  - [ ] Implement Argon2id password hashing and comparison utilities
  - [ ] Implement JWT access token signing & refresh token rotation with HTTP-only cookies
  - [ ] Implement `IUserRepository` and `UserService` in `backend/src/modules/users/`
  - [ ] Implement `IAuthService` and `AuthController` with endpoints:
    - `POST /api/v1/auth/register`
    - `POST /api/v1/auth/login`
    - `POST /api/v1/auth/refresh-token`
    - `POST /api/v1/auth/logout`
    - `GET /api/v1/auth/me`
    - `POST /api/v1/auth/switch-business`
  - [ ] Build middleware pipeline: `authMiddleware`, `tenantScopeGuard`, `roleGuard`
  - [ ] Implement Frontend Auth feature slice (`frontend/src/features/auth/`):
    - Login page with branding
    - Registration page (Business signup & Customer signup)
    - Protected route wrappers for the 4 panel interfaces
  - [ ] Automated tests: Auth lifecycle, token rotation theft detection, permission checks

---

### 🏢 Phase 2: SaaS Plans, Business Profile & Branch Management
- **Domain Spec:** `.agents/context/modules/02-saas-plans-and-platform-billing.md` & `03-businesses-branches-and-tenancy.md`
- **Database Models:** `SaaSPlan`, `BusinessSubscription`, `Business`, `Branch`
- **Tasks:**
  - [ ] Seed default platform SaaS plans: Free Trial, Starter, Professional, Enterprise
  - [ ] Implement `BusinessRepository` and `BusinessService`:
    - Workspace creation with unique slug generation
    - Automatic creation of default Branch (`Main Bottling Plant`)
    - Association of business owner membership
  - [ ] Implement business configuration endpoints:
    - `POST /api/v1/businesses` (Create business)
    - `GET /api/v1/businesses/:id` (Get settings)
    - `PUT /api/v1/businesses/:id` (Update logo, bottle prices, deposit rates, working hours)
    - `POST /api/v1/businesses/:id/branches` (Create depot/branch)
    - `GET /api/v1/businesses/:id/branches` (List branches)
    - `POST /api/v1/businesses/:id/invite` (Invite staff)
  - [ ] Build Business Admin Settings UI:
    - Business profile form with logo upload
    - Branch management table with add/edit modal
    - Staff invitation dialog with role selection
  - [ ] Automated tests: Tenant creation and plan limit enforcement

---

### 👥 Phase 3: Customer Management & Delivery Addresses
- **Domain Spec:** `.agents/context/modules/05-customers-and-addresses.md`
- **Database Models:** `Customer`, `Address`
- **Tasks:**
  - [ ] Implement `CustomerRepository` with compound search (name, phone, area)
  - [ ] Implement `CustomerService` enforcing phone uniqueness per business
  - [ ] Implement endpoints:
    - `GET /api/v1/customers` (Paginated list with search, status filters)
    - `POST /api/v1/customers` (Create customer profile)
    - `GET /api/v1/customers/:id` (Full profile, cached bottle & deposit balance)
    - `PUT /api/v1/customers/:id` (Update customer notes and status)
    - `POST /api/v1/customers/:id/addresses` (Add delivery address with GPS lat/lng)
    - `GET /api/v1/customers/:id/bottle-history` (Retrieve bottle ledger)
  - [ ] Build Customer Management UI:
    - Customers data table with search, status badges, and balance pills
    - Customer details drawer / modal showing active addresses and bottle counts
    - Address creation dialog with street, area, and delivery instructions
  - [ ] Automated tests: Customer creation, duplicate phone rejection, address linkage

---

### 🍶 Phase 4: Product Catalog & Category Management
- **Domain Spec:** `.agents/context/modules/06-products-categories-and-pricing.md`
- **Database Models:** `Category`, `Product`
- **Tasks:**
  - [ ] Implement `ProductRepository` and `CategoryRepository`
  - [ ] Seed standard catalog defaults (19L Refill, 19L New Bottle, 12L Bottle, Manual Dispenser Pump)
  - [ ] Implement endpoints:
    - `GET /api/v1/products` (Catalog list with category filter)
    - `POST /api/v1/products` (Create product with selling price and deposit price)
    - `PUT /api/v1/products/:id` (Update pricing, SKU, active status)
    - `POST /api/v1/products/categories` (Create category)
    - `GET /api/v1/products/categories` (List categories)
  - [ ] Build Product Catalog UI:
    - Grid view and table view of products with price and deposit badges
    - Add/Edit product modal with category selector and image preview
  - [ ] Automated tests: SKU uniqueness per business, non-negative pricing validation

---

### 📦 Phase 5: Inventory & Branch Stock Operations
- **Domain Spec:** `.agents/context/modules/09-inventory-and-stock-transactions.md`
- **Database Models:** `Inventory`, `StockTransaction`
- **Tasks:**
  - [ ] Implement `InventoryRepository` tracking Full, Empty, and Damaged bottle stock
  - [ ] Implement atomic stock mutations using Prisma transactions:
    - Stock In (production refill intake)
    - Stock Out (wastage/breakage)
    - Inter-branch transfers (`BRANCH_TRANSFER_OUT` + `BRANCH_TRANSFER_IN`)
  - [ ] Implement endpoints:
    - `GET /api/v1/inventory` (Stock levels per branch)
    - `POST /api/v1/inventory/adjust` (Stock count correction with reason)
    - `POST /api/v1/inventory/transfer` (Transfer stock between branches)
    - `GET /api/v1/inventory/transactions` (Audit log of all movements)
  - [ ] Build Inventory UI:
    - Depot stock cards (Full Bottles, Empty Bottles, Damaged Bottles)
    - Stock adjustment modal with transaction reason dropdown
    - Branch transfer modal
  - [ ] Automated tests: Atomic stock transfers, negative stock prevention

---

### 🛒 Phase 6: Order Management & Invoicing Engine
- **Domain Spec:** `.agents/context/modules/07-orders-and-invoicing.md`
- **Database Models:** `Order`, `OrderItem`, `Invoice`
- **Tasks:**
  - [ ] Implement `OrderRepository` and `InvoiceRepository`
  - [ ] Implement `OrderService` with 8-stage state machine:
    - Price snapshot calculation (freezing unitPrice and unitDeposit in `OrderItem`)
    - Automatic invoice generation upon order confirmation
    - Stock reservation checks
  - [ ] Implement endpoints:
    - `POST /api/v1/orders` (Place order from customer portal or business desk)
    - `GET /api/v1/orders` (Filter by status, date range, branch, driver)
    - `GET /api/v1/orders/:id` (Order details + invoice data)
    - `PATCH /api/v1/orders/:id/status` (Transition order lifecycle)
    - `POST /api/v1/orders/:id/assign` (Assign driver and generate delivery task)
    - `GET /api/v1/orders/:id/invoice` (Printable invoice data)
  - [ ] Build Order Management UI:
    - Kanban / Table view of orders sorted by status tabs
    - Order detail view with item breakdown, customer address, and driver assignment dropdown
    - Printable PDF/HTML invoice view
  - [ ] Automated tests: Order lifecycle transitions, price snapshot immutability, invoice calculation

---

### 🔄 Phase 7: Empty Bottle Ledger & Deposit Accounting
- **Domain Spec:** `.agents/context/modules/08-bottle-ledger-and-deposits.md`
- **Database Models:** `BottleLedgerEntry`, `Customer` (balance updates)
- **Tasks:**
  - [ ] Implement `BottleLedgerRepository` (append-only ledger writes)
  - [ ] Implement `BottleLedgerService`:
    - Automatic entry on delivery completion (Full delivered, Empty returned)
    - Customer running balance calculations
    - Deposit liability escrow tracking
    - Over-return validation guard
  - [ ] Implement endpoints:
    - `GET /api/v1/bottle-ledger/customer/:customerId` (Full ledger history)
    - `POST /api/v1/bottle-ledger/entries` (Audited manual adjustment or refund)
    - `GET /api/v1/bottle-ledger/reconciliation` (Business-wide bottle audit)
  - [ ] Build Bottle Ledger UI:
    - Customer bottle ledger tab showing date, order #, delivered, returned, net balance
    - Manual bottle adjustment dialog with manager authorization
    - Business bottle audit dashboard
  - [ ] Automated tests: Double-entry consistency, over-return rejection, refund math

---

### 🚚 Phase 8: Delivery Dispatch & Delivery Staff Panel
- **Domain Spec:** `.agents/context/modules/10-delivery-management-and-dispatch.md`
- **Database Models:** `Delivery`, `Order`, `Payment`, `BottleLedgerEntry`
- **Tasks:**
  - [ ] Implement `DeliveryRepository` and `DeliveryService`:
    - Route sequencing (stop order)
    - OTP generation and validation
    - Multi-entity delivery completion transaction
  - [ ] Implement endpoints:
    - `GET /api/v1/deliveries/my-deliveries` (Driver active route)
    - `POST /api/v1/deliveries/:id/start` (Mark out for delivery)
    - `POST /api/v1/deliveries/:id/complete` (Submit OTP, cash collected, empty bottles returned)
    - `POST /api/v1/deliveries/:id/failed` (Record failure reason)
  - [ ] Build Mobile-Optimized Delivery Staff Panel (`frontend/src/features/delivery-panel/`):
    - Daily route stops list with call customer and navigation buttons
    - Delivery execution modal:
      - Full bottles delivering (fixed from order)
      - Empty bottles collected (input stepper)
      - Cash collected (input field)
      - OTP input field (or driver override)
  - [ ] Automated tests: Delivery completion transaction, OTP validation, driver cash settlement

---

### 🔁 Phase 9: Recurring Subscriptions & BullMQ Dispatch Engine
- **Domain Spec:** `.agents/context/modules/11-subscriptions-and-recurring-jobs.md`
- **Database Models:** `Subscription`, `SubscriptionItem`
- **Tasks:**
  - [ ] Set up BullMQ queue (`subscription-dispatch-queue`) and Redis connection
  - [ ] Implement `SubscriptionRepository` and `SubscriptionService`:
    - Schedule creation (Daily, Alternate Days, Weekly, Custom days)
    - Pause, resume, and cancellation lifecycle
  - [ ] Implement BullMQ dispatch worker:
    - Daily 00:30 AM cron job
    - Deterministic job deduplication keys
    - Automated order generation with `scheduledDate = today`
  - [ ] Implement endpoints:
    - `POST /api/v1/subscriptions` (Create subscription)
    - `GET /api/v1/subscriptions` (List subscriptions with status filters)
    - `PATCH /api/v1/subscriptions/:id/pause`
    - `PATCH /api/v1/subscriptions/:id/resume`
    - `DELETE /api/v1/subscriptions/:id`
  - [ ] Build Subscription UI in Customer Portal & Business Admin:
    - Customer recurring delivery setup wizard (Select bottles, frequency, delivery days)
    - Active subscriptions list with Pause/Resume toggle buttons
  - [ ] Automated tests: BullMQ cron worker idempotency, pause/resume logic

---

### 💰 Phase 10: Payments, Accounting & Financial Reconciliation
- **Domain Spec:** `.agents/context/modules/12-payments-accounting-and-cash-reconciliation.md`
- **Database Models:** `Payment`, `Expense`, `Invoice`
- **Tasks:**
  - [ ] Implement `PaymentRepository` and `ExpenseRepository`
  - [ ] Implement driver cash reconciliation workflow:
    - Driver marks `cashCollected` -> Status: `COLLECTED_BY_DRIVER`
    - Cashier reconciles physical cash at depot -> Status: `RECONCILED`
  - [ ] Implement endpoints:
    - `POST /api/v1/accounting/payments` (Record payment)
    - `POST /api/v1/accounting/payments/:id/reconcile` (Reconcile driver cash)
    - `POST /api/v1/accounting/expenses` (Log business expense with receipt)
    - `GET /api/v1/accounting/expenses` (Expense list with category filters)
    - `GET /api/v1/accounting/reports/pnl` (P&L report: Revenue, COGS, Expenses, Net Profit)
  - [ ] Build Accounting & Finance UI:
    - Driver daily cash reconciliation table with "Reconcile Cash" action button
    - Expense management table with "Add Expense" modal
    - Financial statement view with date range filter
  - [ ] Automated tests: Driver cash settlement, expense calculation, P&L aggregation

---

### ⚡ Phase 11: Real-Time Sockets & In-App Notifications
- **Domain Spec:** `.agents/context/modules/13-notifications-and-realtime-sockets.md`
- **Database Models:** `Notification`
- **Tasks:**
  - [ ] Set up Socket.IO server on the Express HTTP instance
  - [ ] Implement tenant room authorization and handshake guards
  - [ ] Implement event emitters:
    - `order:new` (Alerts business dashboard)
    - `delivery:out` (Alerts customer)
    - `delivery:completed` (Alerts customer & dispatcher)
    - `inventory:low_stock` (Alerts manager)
  - [ ] Implement notification repository and endpoints:
    - `GET /api/v1/notifications` (List notifications)
    - `PATCH /api/v1/notifications/:id/read` (Mark as read)
  - [ ] Build Real-Time UI Elements:
    - Header notification bell with unread badge and dropdown
    - Real-time toast popups when new orders or deliveries occur
  - [ ] Automated tests: Socket authentication and tenant-isolated event broadcasting

---

### 📊 Phase 12: Analytical Dashboards & Reporting
- **Domain Spec:** `.agents/context/modules/14-dashboards-reporting-and-analytics.md`
- **Tasks:**
  - [ ] Implement analytics aggregation services using PostgreSQL SQL queries
  - [ ] Implement Super Admin endpoints:
    - `GET /api/v1/admin/analytics/overview` (Total businesses, MRR, growth)
  - [ ] Implement Business Admin endpoints:
    - `GET /api/v1/analytics/overview` (Today's orders, revenue, bottles, deliveries)
    - `GET /api/v1/analytics/bottle-trends` (30-day bottle return vs delivered ratio)
    - `GET /api/v1/analytics/driver-performance` (Driver completion rates)
  - [ ] Build Super Admin Dashboard UI:
    - Platform KPI summary cards
    - Business tenant directory with status badges and quick actions
    - SaaS MRR chart
  - [ ] Build Business Admin Dashboard UI:
    - Today's operations KPI grid (Orders, Revenue, Dispatched Bottles, Returns)
    - Recharts Area Chart for 30-day revenue and bottle trends
    - Quick actions bar (New Order, Dispatch Route, Record Intake)
  - [ ] Automated tests: Analytics aggregation accuracy with realistic seed data

---

### 🐳 Phase 13: Dockerization, Deployment & Documentation
- [ ] Create production-ready `backend/Dockerfile` and `frontend/Dockerfile`
- [ ] Create master `docker-compose.yml` (PostgreSQL 16, Redis 7, Backend, Frontend)
- [ ] Configure environment variables `.env.example` with clear documentation
- [ ] Implement Swagger/OpenAPI interactive API documentation
- [ ] Prepare comprehensive database seeding script (`prisma/seed.ts`) with two distinct businesses
- [ ] Write complete operational manual and portfolio demonstration guide


# AquaFlow ERP — Master Database Architecture: Tables with Schema

> **Document Name:** `tables with schema.md`  
> **Workspace:** `d:\Backend Portfolio\AquaFlow`  
> **Role:** Principal Database Design Engineer & Enterprise ERP Architect  
> **Target Database Engine:** PostgreSQL 16+ via TypeORM ORM  
> **Reference Systems Analyzed:** `sch/Security/Database` & `sch/API/Database`  
> **Implementation Strategy:** **Strict Step-by-Step / Phase-by-Phase** (Never dump all tables at once. Each phase implements its respective schema, tests it, and commits it).

---

## 📑 Master Table of Contents

1. [Architectural Principles & PostgreSQL Multi-Schema Strategy](#1-architectural-principles--postgresql-multi-schema-strategy)
2. [Master Phase-by-Phase Implementation Roadmap](#2-master-phase-by-phase-implementation-roadmap)
3. [Schema 1: `security` (Identity, Authentication, RBAC & Scopes)](#schema-1-security-identity-authentication-rbac--scopes)
4. [Schema 2: `settings` (Dynamic ERP Modules, Menus & Configurations)](#schema-2-settings-dynamic-erp-modules-menus--configurations)
5. [Schema 3: `config` (Geography, Timezones & System Lookups)](#schema-3-config-geography-timezones--system-lookups)
6. [Schema 4: `core` (Multi-Tenant Hierarchy: Businesses, Depots & Operating Shifts)](#schema-4-core-multi-tenant-hierarchy-businesses-depots--operating-shifts)
7. [Schema 5: `hr` (Employees, Delivery Drivers, Attendance & Leave Requests)](#schema-5-hr-employees-delivery-drivers-attendance--leave-requests)
8. [Schema 6: `crm` (Customers, Onboarding Pipeline, Delivery Addresses & Bottle Balances)](#schema-6-crm-customers-onboarding-pipeline-delivery-addresses--bottle-balances)
9. [Schema 7: `catalog` & `inventory` (Products, Plant Production, Stock & Bottle Asset Ledger)](#schema-7-catalog--inventory-products-plant-production-stock--bottle-asset-ledger)
10. [Schema 8: `logistics` (Orders, Gate Passes, Delivery Runs & Bitmask Subscriptions)](#schema-8-logistics-orders-gate-passes-delivery-runs--bitmask-subscriptions)
11. [Schema 9: `billing` (Challan Vouchers, Arrears, Discount Packages & Payments)](#schema-9-billing-challan-vouchers-arrears-discount-packages--payments)
12. [Schema 10: `notify` (Multi-Channel Notification Outbox & Idempotent Scheduler)](#schema-10-notify-multi-channel-notification-outbox--idempotent-scheduler)
13. [Schema 11: `audit` & `log` (Snapshots, Field Diffs, History & Mobile Telemetry)](#schema-11-audit--log-snapshots-field-diffs-history--mobile-telemetry)

---

## 1. Architectural Principles & PostgreSQL Multi-Schema Strategy

Instead of polluting a single flat `public` schema with 50+ tables, AquaFlow ERP implements **PostgreSQL Bounded Context Schemas**:

```text
PostgreSQL: aquaflow_db
├── security.   -> Authentication, Users, Roles, Permissions, Sessions, User Subordinates
├── settings.   -> ERP Modules, Menus, MenuPermissions, Configurations, Default Values
├── config.     -> Countries, States, Cities, TimeZones, Designations, EmploymentTypes
├── core.       -> Businesses (Tenants), Branches (Plants/Depots), OperatingShifts
├── hr.         -> Employees (Staff/Drivers), Attendances, LeaveRequests
├── crm.        -> Customers, CustomerAddresses, CustomerOnboardingHistory
├── catalog.    -> Categories, Products, ProductPrices
├── inventory.  -> BranchInventories, StockTransactions, BottleLedgerEntries
├── logistics.  -> VehicleGatePasses, Orders, OrderItems, Deliveries, RecurrenceRules, Occurrences
├── billing.    -> ChargeTypes, DiscountPackages, VoucherProcessingRuns, BillingVouchers, VoucherDetails, Payments
├── notify.     -> NotificationTypes, TenantSettings, Templates, Deliveries, ScheduleRules, ScheduleRuns
└── audit_log.  -> BottleLedgerAudits, PlantDailySnapshots, CustomerHistories, MobileLogBatches, ErrorLogs
```

### 🛡️ Non-Negotiable Database Invariants:
1. **Never Hard Delete Operational Data**: All business tables feature `is_deleted BOOLEAN NOT NULL DEFAULT false` or `active BOOLEAN NOT NULL DEFAULT true`.
2. **Filtered Partial Unique Indexes**: Unique constraints on soft-deletable tables MUST use PostgreSQL partial indexes (e.g. `CREATE UNIQUE INDEX uq_business_code ON core.businesses (business_code) WHERE is_deleted = false;`).
3. **Master Base Entity & Enterprise Audit Septet**: All tables inherit from `BaseEntity` (`src/entities/base.entity.ts`):
   - `id INT SERIAL PRIMARY KEY` (Auto-increment `number`)
   - `is_active BOOLEAN NOT NULL DEFAULT true` (Operational activation flag)
   - `created_on TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()`
   - `created_by INT NULL` (User ID who created the record)
   - `modified_on TIMESTAMPTZ(3) NULL`
   - `modified_by INT NULL` (User ID who modified the record)
   - `deleted_on TIMESTAMPTZ(3) NULL` (TypeORM `@DeleteDateColumn` automatic soft-delete engine)
   - `deleted_by INT NULL` (User ID who soft-deleted/archived the record)
4. **Monetary Precision**: Money, deposits, and prices are strictly `DECIMAL(18, 2)` or integer minor units. Never floating point numbers.
5. **Decoupled Identity vs. HR Master**: `security.users` handles credentials; `hr.employees` handles staff/driver profile, salary, CNIC, and commission.

---

## 2. Master Phase-by-Phase Implementation Roadmap

To prevent overwhelming the system and ensure every single table is thoroughly validated, tested, and type-checked before proceeding:

| Phase | Schema(s) Focus | Tables to Implement | Verification Gate |
| :---: | :--- | :--- | :--- |
| **Phase 1** | `security` & `settings` | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `erp_modules`, `menus`, `menu_permissions`, `configurations`, `user_sessions`, `password_reset_requests`, `user_subordinates`, `user_assigned_branches/shifts/zones` | TypeORM sync, Argon2 password hash tests, JWT session lifecycle tests |
| **Phase 2** | `config` & `core` | `time_zones`, `countries`, `states`, `cities`, `delivery_zones`, `businesses`, `branches`, `operating_shifts` | Tenant onboarding test, filtered unique head office index test |
| **Phase 3** | `hr` & `crm` | `employees`, `employee_attendances`, `leave_requests`, `customers`, `customer_addresses`, `customer_onboarding_history` | Driver commission mapping test, customer code uniqueness, address sequence |
| **Phase 4** | `catalog` & `inventory` | `categories`, `products`, `branch_inventories`, `stock_transactions`, `bottle_ledger_entries` | Atomic inventory mutations, double-entry bottle ledger invariant tests |
| **Phase 5** | `logistics` | `vehicle_gate_passes`, `orders`, `order_items`, `deliveries`, `subscription_recurrence_rules`, `subscription_occurrences` | Gate pass dispatch/return balance, bitmask recurrence calculation tests |
| **Phase 6** | `billing` | `charge_types`, `discount_packages`, `discount_package_details`, `voucher_processing_runs`, `billing_vouchers`, `billing_voucher_details`, `billing_voucher_payments` | Voucher generation batch tests, previous arrears carry-forward math tests |
| **Phase 7** | `notify` | `notification_types`, `notification_tenant_settings`, `notification_settings`, `notification_templates`, `notification_deliveries`, `schedule_rules`, `schedule_runs` | Notification outbox worker tests, idempotent window key tests |
| **Phase 8** | `audit` & `log` | `bottle_ledger_audits`, `plant_daily_snapshots`, `customer_histories`, `mobile_log_batches`, `mobile_log_entries`, `error_logs` | Audit diff triggers, mobile batch log ingestion tests |

---

## Schema 1: `security` (Identity, Authentication, RBAC & Scopes)

### Table 1.1: `security.users` (IMPLEMENTED ✅)
*Derived from `[Security].[Users]` in `sch`.* Stores global authentication credentials, lockouts, and personal profile. Uses auto-increment `INT` / `number` primary key.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `user_name` | `VARCHAR(50)` | NO | — | Unique handle across platform |
| `email` | `VARCHAR(150)` | NO | — | Filtered Unique Index `WHERE email <> ''` |
| `cell_phone` | `VARCHAR(20)` | YES | NULL | Phone number for OTP login (Indexed) |
| `password_hash` | `TEXT` | NO | — | Argon2id hash (`select: false`) |
| `user_type` | `SMALLINT` | YES | NULL | `1=SuperAdmin, 2=ClientAdmin, 3=Employee, 4=DeliveryDriver, 5=Customer` (Default: NULL) |
| `first_name` | `VARCHAR(150)` | NO | — | First name |
| `middle_name` | `VARCHAR(150)` | NO | `''` | Middle name |
| `last_name` | `VARCHAR(150)` | NO | — | Last name |
| `image_path` | `TEXT` | YES | NULL | Avatar/profile picture URL |
| `is_email_verified` | `BOOLEAN` | NO | `false` | Email verification flag |
| `verification_key` | `VARCHAR(100)` | YES | NULL | Verification token |
| `is_account_locked` | `BOOLEAN` | NO | `false` | Security lock after failed attempts |
| `failed_login_attempts` | `SMALLINT` | NO | `0` | Consecutive failed password counter |
| `active` | `BOOLEAN` | NO | `true` | Account active state |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit creation timestamp |
| `created_by` | `INT` | YES | NULL | User ID who created record |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit modified timestamp |
| `modified_by` | `INT` | YES | NULL | User ID who modified record |
| `is_deleted` | `BOOLEAN` | NO | `false` | Soft-delete flag |

---

### Table 1.2: `security.roles` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Security].[Role]` in `sch`.* RBAC roles with integer primary key. Seeded with 5 core roles: `SuperAdmin (SA)`, `ClientAdmin (CA)`, `Employee (EM)`, `DeliveryDriver (DD)`, `Customer (CU)`.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `name` | `VARCHAR(100)` | NO | — | Unique Role Name (e.g., `SuperAdmin`, `ClientAdmin`) |
| `code` | `VARCHAR(50)` | NO | — | Unique Role Code (`SA`, `CA`, `EM`, `DD`, `CU`) |
| `description` | `VARCHAR(250)` | YES | NULL | Summary of role capabilities |
| `active` | `BOOLEAN` | NO | `true` | Role active flag |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit timestamp |
| `modified_by` | `INT` | YES | NULL | Audit user |

---

### Table 1.3: `security.permissions` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Security].[Permission]` in `sch`.* Atomic system actions with integer primary key. Seeded with `dashboard:read`.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `name` | `VARCHAR(100)` | NO | — | Unique key (e.g. `dashboard:read`) |
| `description` | `VARCHAR(250)` | YES | NULL | Description of capability |
| `is_super_admin_only` | `BOOLEAN` | NO | `false` | Restricts permission to platform owners |
| `active` | `BOOLEAN` | NO | `true` | Permission active flag |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit timestamp |
| `modified_by` | `INT` | YES | NULL | Audit user |

---

### Table 1.4: `security.user_roles`
*Derived from `[Security].[UserRoles]` in `sch`.* Assigns users to roles per business tenant.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | Primary Key |
| `user_id` | `INT` | NO | — | FK -> `security.users(id)` ON DELETE CASCADE |
| `role_id` | `INT` | NO | — | FK -> `security.roles(id)` ON DELETE CASCADE |
| `business_id` | `INT` | YES | NULL | FK -> `core.businesses(id)` ON DELETE CASCADE |
| `active` | `BOOLEAN` | NO | `true` | Assignment status |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |

*Unique Index:* `UNIQUE (user_id, role_id, business_id)`

---

### Table 1.5: `security.role_permissions` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Security].[RolePermission]` in `sch`.* Maps permissions to roles with integer primary key. Seeded mapping `dashboard:read` to `ClientAdmin` & `Employee`.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `role_id` | `INT` | NO | — | FK -> `security.roles(id)` ON DELETE CASCADE |
| `permission_id` | `INT` | NO | — | FK -> `security.permissions(id)` ON DELETE CASCADE |
| `active` | `BOOLEAN` | NO | `true` | Active status |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit timestamp |
| `modified_by` | `INT` | YES | NULL | Audit user |

*Unique Index:* `UNIQUE (role_id, permission_id)`

---

### Table 1.6: `security.user_sessions`
*Derived from `[Security].[UserSessions]` in `sch`.* Tracks active tokens, devices, and session security.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | NO | — | FK -> `security.users(id)` ON DELETE CASCADE |
| `business_id` | `UUID` | YES | NULL | Active tenant context |
| `user_type` | `VARCHAR(50)` | NO | — | Identity category |
| `session_id` | `VARCHAR(100)` | NO | — | Unique session GUID |
| `refresh_token_hash`| `TEXT` | NO | — | Hashed refresh token |
| `token_family` | `UUID` | NO | — | Token rotation family for reuse detection |
| `request_headers` | `JSONB` | NO | `'{}'` | User-Agent, Mobile Model, App Version |
| `ip_address` | `VARCHAR(50)` | YES | NULL | Client IP address |
| `permissions_snapshot`| `JSONB` | YES | NULL | Cached permissions for rapid authorization |
| `expires_at` | `TIMESTAMPTZ` | NO | — | Refresh token expiration |
| `revoked_at` | `TIMESTAMPTZ` | YES | NULL | Revocation timestamp if logged out |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Session creation time |

---

### Table 1.7: `security.password_reset_requests`
*Derived from `[Security].[PasswordResetRequest]` in `sch`.*

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | `UUID` | NO | — | FK -> `security.users(id)` ON DELETE CASCADE |
| `otp` | `VARCHAR(10)` | NO | — | 6-digit numeric OTP |
| `otp_expiry` | `TIMESTAMPTZ` | NO | — | Expiration timestamp (10 minutes) |
| `reset_token` | `VARCHAR(100)` | YES | NULL | Cryptographic token issued after OTP validation |
| `is_used` | `BOOLEAN` | NO | `false` | Single-use flag |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Creation timestamp |

---

### Tables 1.8 - 1.11: Hierarchical Scope Assignments
*Derived from `UserSubOrdinates`, `UserAssignedClients`, `UserAssignedSchoolShifts`, `UserAssignedSections` in `sch`.*

- **`security.user_subordinates`**: `id`, `business_id`, `user_id` (Manager/Supervisor), `subordinate_user_id` (Driver/Worker), `assigned_on`, `assigned_by`.
- **`security.user_assigned_branches`**: `id`, `user_id`, `branch_id`, `active` (`UNIQUE(user_id, branch_id)`). Restricts dispatchers & drivers to specific water filling plants.
- **`security.user_assigned_shifts`**: `id`, `user_id`, `shift_id`, `active` (`UNIQUE(user_id, shift_id)`). Restricts drivers to Morning/Evening delivery shifts.
- **`security.user_assigned_zones`**: `id`, `user_id`, `delivery_zone_id`, `active` (`UNIQUE(user_id, delivery_zone_id)`). Restricts drivers to specific delivery territories.

---

## Schema 2: `settings` (Dynamic ERP Modules, Menus & Configurations)

### Table 2.1: `settings.erp_modules` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Settings].[Module]` in `sch`.* Enterprise modules toggled per tenant subscription. Uses auto-increment `INT` / `number` primary key.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (`number`)** |
| `code` | `VARCHAR(50)` | NO | — | Unique module code (`UNIQUE`), e.g. `CORE_POS`, `BOTTLE_LEDGER` |
| `name` | `VARCHAR(100)` | NO | — | Module display name |
| `description` | `TEXT` | YES | NULL | Module functionality summary |
| `display_order` | `INT` | NO | `0` | Order in UI module lists |
| `is_active` | `BOOLEAN` | NO | `true` | System-wide module availability |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit creation timestamp |
| `created_by` | `INT` | YES | NULL | User ID who created record |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit modified timestamp |
| `modified_by` | `INT` | YES | NULL | User ID who modified record |

#### 📦 Seeded Core Modules in Database:
1. `CORE_POS` — Point of Sale & Orders
2. `BOTTLE_LEDGER` — Empty Bottle Asset Ledger
3. `SUBSCRIPTION_ENGINE` — Recurring Delivery Plans
4. `FLEET_GATE_PASS` — Vehicle Dispatch & Gate Pass
5. `VOUCHER_BILLING` — Monthly Billing & Arrears
6. `PLANT_INVENTORY` — Bottling & Stock Operations
7. `HR_PAYROLL` — Staff & Driver Management
8. `NOTIFICATIONS` — Alerts & Outbox

---

### Table 2.2: `settings.menus`
*Derived from `[Settings].[Menu]` in `sch`.* Database-driven sidebar, sub-parent routing, and breadcrumb navigation.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | NO | — | Primary Key (`IDENTITY`) |
| `module_id` | `INT` | YES | NULL | FK -> `settings.erp_modules(id)` |
| `name` | `VARCHAR(100)` | NO | — | Unique internal menu name |
| `title` | `VARCHAR(100)` | NO | — | Sidebar label |
| `parent` | `VARCHAR(100)` | YES | NULL | Parent menu group (e.g. `'Logistics'`) |
| `sub_parent` | `VARCHAR(100)` | YES | NULL | Nested grouping (e.g. `'Dispatch'`) |
| `url` | `VARCHAR(500)` | NO | — | React frontend route URL |
| `permission_id` | `UUID` | YES | NULL | Required permission to view menu |
| `order_no` | `INT` | NO | `0` | Display sorting order |
| `current_page` | `VARCHAR(100)` | NO | — | Page identifier token |
| `breadcrumb` | `VARCHAR(500)` | NO | — | Navigation path string |
| `is_breadcrumb_enable`| `BOOLEAN`| NO | `true` | UI breadcrumb toggle |
| `parent_icon_class` | `VARCHAR(250)`| YES | NULL | Lucide/CSS icon name for parent |
| `sub_parent_icon_class`| `VARCHAR(250)`| YES | NULL | Icon for sub-parent |
| `menu_icon_class` | `VARCHAR(250)`| YES | NULL | Icon for leaf menu item |
| `user_types` | `VARCHAR(100)`| YES | NULL | Permitted user types (`'1,2,3'`) |
| `is_visible` | `BOOLEAN` | NO | `true` | Visibility toggle |
| `active` | `BOOLEAN` | NO | `true` | Status flag |

---

### Table 2.3: `security.menu_permissions`
*Derived from `[Security].[MenuPermission]` in `sch`.* Explicit role-to-menu visibility access.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `menu_id` | `INT` | NO | — | FK -> `settings.menus(id)` |
| `permission_id` | `UUID` | NO | — | FK -> `security.permissions(id)` |
| `active` | `BOOLEAN` | NO | `true` | Status flag |
| `created_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Audit timestamp |
| `created_by` | `UUID` | YES | NULL | Audit user |

*Unique Index:* `UNIQUE (menu_id, permission_id)`

---

### Table 2.4: `settings.configurations` & `settings.tenant_configuration_values`
*Derived from `[Settings].[Configuration]` and `Configuration_Default_Values` in `sch`.* Page-level & tenant business rules.

- **`settings.configurations`**:
  - `id`: `INT` PK
  - `menu_id`: `INT` FK -> `settings.menus(id)`
  - `key`: `VARCHAR(100)` NOT NULL (e.g. `REQUIRE_DELIVERY_OTP`, `ALLOW_NEGATIVE_INVENTORY`, `AUTO_APPLY_LATE_FEE`)
  - `default_value`: `VARCHAR(150)` NULL
  - `key_type`: `VARCHAR(50)` (`BOOLEAN`, `INTEGER`, `DECIMAL`, `STRING`)
  - `is_enabled`: `BOOLEAN` DEFAULT `true`
  - `description`: `TEXT` NULL
  - `is_coa_config`: `BOOLEAN` DEFAULT `false` (Links to Chart of Accounts financial ledger)
  - `multi_value`: `BOOLEAN` DEFAULT `false`
- **`settings.tenant_configuration_values`**:
  - `id`: `UUID` PK
  - `business_id`: `UUID` FK -> `core.businesses(id)`
  - `branch_id`: `UUID` NULL FK -> `core.branches(id)` (Allows depot-specific overrides!)
  - `config_id`: `INT` FK -> `settings.configurations(id)`
  - `config_value`: `VARCHAR(500)` NOT NULL
  - `active`: `BOOLEAN` DEFAULT `true`
  - `modified_on`: `TIMESTAMPTZ(3)`

---

## Schema 3: `config` (Geography, Timezones & System Lookups)

### Table 3.1: `config.time_zones`
*Derived from `Config.TimeZone.sql` in `sch`.*

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | NO | `IDENTITY` | Primary Key |
| `name` | `VARCHAR(100)` | NO | — | Display name (e.g. `Pakistan`) |
| `description` | `VARCHAR(250)` | YES | NULL | Description (e.g. `Islamabad / Karachi`) |
| `time_zone_code`| `VARCHAR(100)` | NO | — | Standard IANA / Windows code (`Pakistan Standard Time`, `UTC`) |
| `display_offset`| `VARCHAR(10)` | YES | NULL | Offset string (`GMT+05:00`) |
| `is_active` | `BOOLEAN` | NO | `true` | Status flag |

---

### Table 3.2: `config.user_types` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Config].[UserType]` in `sch`.* System user classification lookup. Seeded with 5 user types: `SuperAdmin (SA)`, `ClientAdmin (CA)`, `Employee (EM)`, `DeliveryDriver (DD)`, `Customer (CU)`.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `name` | `VARCHAR(50)` | NO | — | Unique Name (`SuperAdmin`, `ClientAdmin`, `Employee`, `DeliveryDriver`, `Customer`) |
| `code` | `VARCHAR(10)` | NO | — | Unique Code (`SA`, `CA`, `EM`, `DD`, `CU`) |
| `active` | `BOOLEAN` | NO | `true` | Status flag |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit creation timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit modification timestamp |
| `modified_by` | `INT` | YES | NULL | Audit user |

---

### Table 3.3: `config.employment_types` (IMPLEMENTED & SEEDED ✅)
*Derived from `[Config].[EmployeementType]` in `sch`.* Enterprise employee contract and compensation model. Seeded with 7 employment types: `Permanent`, `Contractual`, `CommissionBased`, `DailyWages`, `Temporary`, `Internee`, `ShortTerm`.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` (`SERIAL`) | NO | `nextval()` | **Primary Key (auto-increment `number`)** |
| `name` | `VARCHAR(50)` | NO | — | Unique Name (`Permanent`, `Commission Based`, `Daily Wages`, etc.) |
| `code` | `VARCHAR(50)` | NO | — | Unique Code (`Permanent`, `CommissionBased`, `DailyWages`, etc.) |
| `description` | `VARCHAR(250)` | YES | NULL | Contract / compensation summary |
| `is_active` | `BOOLEAN` | NO | `true` | Status flag |
| `created_on` | `TIMESTAMPTZ(3)` | NO | `NOW()` | Audit creation timestamp |
| `created_by` | `INT` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)` | YES | NULL | Audit modification timestamp |
| `modified_by` | `INT` | YES | NULL | Audit user |
| `deleted_on` | `TIMESTAMPTZ(3)` | YES | NULL | Soft-delete timestamp (`@DeleteDateColumn`) |
| `deleted_by` | `INT` | YES | NULL | Soft-delete user |

---

### Tables 3.4 - 3.7: Master Geography & Delivery Zones
- **`config.countries`**: `id`, `iso_code` (`VARCHAR(3)`), `name`, `currency_code`, `phone_prefix`, `is_active`.
- **`config.states`**: `id`, `country_id`, `name`, `state_code`, `is_active`.
- **`config.cities`**: `id`, `state_id`, `name`, `is_active`.
- **`config.delivery_zones`**: `id`, `business_id`, `branch_id`, `city_id`, `zone_name` (e.g., `'DHA Phase 5'`, `'Gulshan Sector 13'`), `zone_code`, `delivery_fee_override`, `boundary_polygon` (`JSONB` GeoJSON coordinates), `is_active`.

---

## Schema 4: `core` (Multi-Tenant Hierarchy: Businesses, Depots & Operating Shifts)

### Table 4.1: `core.businesses`
*Derived from `[dbo].[School]` in `sch`.* The primary Water Business Tenant.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_code` | `VARCHAR(50)` | NO | — | Short business prefix. Filtered Unique Index `WHERE is_deleted = false` |
| `business_name` | `VARCHAR(300)` | NO | — | Registered enterprise name |
| `slug` | `VARCHAR(150)` | NO | — | Unique URL subdomain / slug |
| `business_type` | `SMALLINT` | NO | `0` | `0=RO Bottling Plant, 1=Mineral Water Factory, 2=Regional Water Depot` |
| `owner_name` | `VARCHAR(150)` | YES | NULL | Proprietor / Director name |
| `phone` | `VARCHAR(20)` | YES | NULL | Office telephone |
| `cell_phone` | `VARCHAR(20)` | YES | NULL | Primary mobile number |
| `email` | `VARCHAR(100)` | NO | — | Unique corporate email address |
| `website` | `VARCHAR(250)` | YES | NULL | Website URL |
| `logo_path` | `VARCHAR(500)` | YES | NULL | Logo image URL |
| `city_id` | `INT` | YES | NULL | FK -> `config.cities(id)` |
| `state` | `VARCHAR(100)` | YES | NULL | Province/State |
| `currency` | `VARCHAR(10)` | NO | `'PKR'` | Base accounting currency |
| `due_day_of_month`| `SMALLINT` | YES | `10` | Default due day for monthly corporate bills |
| `voucher_validity_days`| `SMALLINT`| YES | `15` | Default billing voucher grace period |
| `default_deposit_19l` | `DECIMAL(18,2)`| NO | `1500.00` | Default security deposit per 19L bottle |
| `default_deposit_12l` | `DECIMAL(18,2)`| NO | `1200.00` | Default security deposit per 12L bottle |
| `default_delivery_fee`| `DECIMAL(18,2)`| NO | `0.00` | Standard delivery fee |
| `theme_primary_color` | `VARCHAR(7)` | YES | NULL | Hex color check `CHECK (theme_primary_color ~ '^#[0-9A-Fa-f]{6}$')` |
| `theme_secondary_color`| `VARCHAR(7)`| YES | NULL | Hex color check `CHECK (theme_secondary_color ~ '^#[0-9A-Fa-f]{6}$')` |
| `status` | `VARCHAR(30)` | NO | `'ACTIVE'` | `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED` |
| `created_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Audit timestamp |
| `created_by` | `UUID` | YES | NULL | Audit user |
| `modified_on` | `TIMESTAMPTZ(3)`| YES | NULL | Audit timestamp |
| `modified_by` | `UUID` | YES | NULL | Audit user |
| `is_deleted` | `BOOLEAN` | NO | `false` | Soft-delete flag |

---

### Table 4.2: `core.branches`
*Derived from `[dbo].[Campus]` in `sch`.* Physical bottling plant or local distribution depot.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | FK -> `core.businesses(id)` ON DELETE CASCADE |
| `branch_name` | `VARCHAR(300)` | NO | — | Depot name (e.g. `'North Karachi Filling Depot'`) |
| `branch_code` | `VARCHAR(20)` | NO | — | Depot code (e.g. `'DEP-01'`) |
| `is_head_office` | `BOOLEAN` | NO | `false` | **Filtered Unique Index:** At most 1 Head Office per `business_id` where `is_deleted = false` |
| `address` | `VARCHAR(300)` | YES | NULL | Physical street address |
| `city_id` | `INT` | YES | NULL | FK -> `config.cities(id)` |
| `latitude` | `DECIMAL(10,7)`| YES | NULL | GPS latitude |
| `longitude` | `DECIMAL(10,7)`| YES | NULL | GPS longitude |
| `geofence_polygon`| `JSONB` | YES | NULL | Boundary polygon for geofenced driver attendance |
| `phone` | `VARCHAR(20)` | YES | NULL | Landline phone |
| `contact_person_number`| `VARCHAR(20)`| YES | NULL | Contact person phone |
| `dispatch_desk_phone`| `VARCHAR(20)`| YES | NULL | Dispatcher helpline |
| `whatsapp_number` | `VARCHAR(20)` | YES | NULL | WhatsApp customer support |
| `email` | `VARCHAR(100)` | YES | NULL | Depot email |
| `plant_manager_name`| `VARCHAR(100)`| YES | NULL | Manager in charge |
| `office_hours` | `VARCHAR(500)` | YES | NULL | Working hours string |
| `time_zone_id` | `INT` | YES | NULL | FK -> `config.time_zones(id)` |
| `order_prefix` | `VARCHAR(10)` | NO | `'ORD-'` | Order number prefix for this branch |
| `voucher_prefix` | `VARCHAR(10)` | NO | `'VCH-'` | Billing voucher prefix for this branch |
| `bank_name` | `VARCHAR(100)` | YES | NULL | Bank name printed on delivery vouchers |
| `bank_account_title`| `VARCHAR(150)`| YES | NULL | Bank title |
| `bank_account_number`| `VARCHAR(100)`| YES | NULL | Bank account number |
| `bank_iban` | `VARCHAR(50)` | YES | NULL | International Bank Account Number |
| `bank_branch_detail`| `VARCHAR(150)`| YES | NULL | Bank branch info |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

---

### Table 4.3: `core.operating_shifts`
*Derived from `[dbo].[SchoolShift]` in `sch`.* Operating delivery & bottling shifts.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | FK -> `core.businesses(id)` |
| `branch_id` | `UUID` | NO | — | FK -> `core.branches(id)` |
| `shift_name` | `VARCHAR(100)` | NO | — | e.g. `'Morning Delivery Shift'`, `'Evening Shift'` |
| `start_time` | `TIME(0)` | NO | — | Shift start time (e.g. `07:30:00`) |
| `end_time` | `TIME(0)` | NO | — | Shift end time (e.g. `14:00:00`) |
| `shift_incharge_id`| `UUID` | YES | NULL | FK -> `security.users(id)` (Dispatcher supervisor) |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

---

## Schema 5: `hr` (Employees, Delivery Drivers, Attendance & Leave Requests)

### Table 5.1: `hr.employees`
*Derived from `[Config].[Employee]` in `sch`.* Complete Staff, Loader, Plant Chemist, and Driver HR Master.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | FK -> `core.businesses(id)` |
| `branch_id` | `UUID` | NO | — | FK -> `core.branches(id)` |
| `employee_code` | `VARCHAR(20)` | NO | — | `UNIQUE (business_id, employee_code)` |
| `login_user_id` | `UUID` | YES | NULL | FK -> `security.users(id)` (Nullable: Loaders have no login; Drivers do!) |
| `manager_id` | `UUID` | YES | NULL | FK -> `security.users(id)` (Direct supervisor) |
| `first_name` | `VARCHAR(150)` | NO | — | First name |
| `middle_name` | `VARCHAR(150)` | YES | NULL | Middle name |
| `last_name` | `VARCHAR(150)` | NO | — | Last name |
| `phone_number` | `VARCHAR(20)` | NO | — | Mobile phone |
| `email` | `VARCHAR(100)` | YES | NULL | Email |
| `cnic` | `VARCHAR(20)` | NO | — | National ID number |
| `cnic_issue_date`| `DATE` | YES | NULL | CNIC issue date |
| `cnic_expiry_date`| `DATE` | YES | NULL | CNIC expiration |
| `driving_license_no`| `VARCHAR(50)`| YES | NULL | Driving license for delivery staff |
| `driving_license_expiry`| `DATE` | YES | NULL | License expiry check |
| `designation_id` | `INT` | YES | NULL | Driver, Helper, Loader, Chemist, Cashier |
| `employment_type_id`| `INT` | NO | — | Permanent, Daily Wage, Commission Basis |
| `hire_date` | `DATE` | NO | — | Date of joining |
| `resign_date` | `DATE` | YES | NULL | Date of leaving |
| `term_reason` | `VARCHAR(500)` | YES | NULL | Termination reason |
| `date_of_birth` | `DATE` | YES | NULL | Birth date |
| `bank_account_no`| `VARCHAR(50)` | YES | NULL | Salary bank account |
| `eobi_no` | `VARCHAR(30)` | YES | NULL | Social security / pension number |
| `gross_pay` | `DECIMAL(12,2)`| NO | `0.00` | Monthly fixed base salary |
| `other_allowances`| `DECIMAL(12,2)`| NO | `0.00` | Fuel / mobile phone allowance |
| `per_bottle_commission`| `DECIMAL(10,2)`| NO | `0.00` | **Driver incentive per 19L bottle delivered!** |
| `status` | `VARCHAR(20)` | NO | `'ACTIVE'` | Active / On Leave / Terminated |
| `active` | `BOOLEAN` | NO | `true` | Status flag |
| `created_on`, `created_by`, `modified_on`, `modified_by` | — | — | — | Audit trail |

---

### Tables 5.2 - 5.3: Attendance & Leave Requests
- **`hr.employee_attendances`**: `id`, `business_id`, `branch_id`, `shift_id`, `employee_id`, `attendance_date`, `check_in_time`, `check_out_time`, `check_in_lat`, `check_in_lng`, `status` (`PRESENT`, `ABSENT`, `LATE`, `ON_LEAVE`), `remarks`, `created_on`, `created_by`.
- **`hr.leave_requests`**: `id`, `business_id`, `employee_id`, `leave_type_id`, `from_date`, `to_date`, `reason`, `status` (`Pending`, `Approved`, `Rejected`), `approved_by`, `approver_remarks`, `approved_on`, `applied_by_user_id`, `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted`.

---

## Schema 6: `crm` (Customers, Onboarding Pipeline, Delivery Addresses & Bottle Balances)

### Table 6.1: `crm.customers`
*Derived from `Student.sql` in `sch`.* Customer Master with synchronized double-entry bottle balances and arrears.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | FK -> `core.businesses(id)` |
| `branch_id` | `UUID` | NO | — | FK -> `core.branches(id)` |
| `shift_id` | `UUID` | YES | NULL | FK -> `core.operating_shifts(id)` (Preferred delivery shift) |
| `customer_code` | `VARCHAR(30)` | NO | — | `UNIQUE (business_id, customer_code)` (e.g. `CUST-DHA-00104`) |
| `user_id` | `UUID` | YES | NULL | FK -> `security.users(id)` (Linked web/mobile customer login) |
| `customer_type` | `VARCHAR(30)` | NO | `'RESIDENTIAL'`| `RESIDENTIAL`, `CORPORATE`, `COMMERCIAL`, `INSTITUTIONAL` |
| `company_name` | `VARCHAR(250)` | YES | NULL | Company name for corporate water accounts |
| `ntn_number` | `VARCHAR(50)` | YES | NULL | Tax registration number for B2B invoices |
| `contact_person_name`| `VARCHAR(150)`| NO | — | Primary contact person |
| `cell_phone` | `VARCHAR(20)` | NO | — | Primary mobile phone |
| `whatsapp_phone` | `VARCHAR(20)` | YES | NULL | WhatsApp delivery alert phone |
| `email` | `VARCHAR(150)` | YES | NULL | Billing email |
| `cnic_number` | `VARCHAR(30)` | YES | NULL | National ID for deposit verification |
| `join_date` | `DATE` | NO | `CURRENT_DATE` | Onboarding date |
| `exit_date` | `DATE` | YES | NULL | Contract closure date |
| `exit_reason` | `VARCHAR(250)` | YES | NULL | Reason for ending water supply |
| `billing_cycle` | `VARCHAR(20)` | NO | `'PER_ORDER'` | `PER_ORDER_COD`, `PREPAID_WALLET`, `MONTHLY_VOUCHER` |
| `discount_package_id`| `UUID` | YES | NULL | FK -> `billing.discount_packages(id)` |
| `credit_limit` | `DECIMAL(18,2)`| NO | `5000.00` | Maximum allowed credit balance |
| `bottle_balance_19l` | `INT` | NO | `0` | **Net 19L full bottles currently held by customer** |
| `bottle_balance_12l` | `INT` | NO | `0` | **Net 12L full bottles currently held by customer** |
| `held_deposit_balance`| `DECIMAL(18,2)`| NO | `0.00` | **Escrow deposit liability held for customer bottles** |
| `outstanding_arrears`| `DECIMAL(18,2)`| NO | `0.00` | **Current unpaid billing arrears owed to business** |
| `prepaid_wallet_balance`| `DECIMAL(18,2)`| NO | `0.00`| Advance prepaid balance |
| `enrollment_status_id`| `SMALLINT` | NO | `1` | `1=Active, 2=Paused, 3=Suspended_Arrears, 4=Closed` |
| `internal_notes` | `TEXT` | YES | NULL | Customer preferences & dispatch instructions |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

---

### Table 6.2: `crm.customer_addresses`
Customer drop locations with GPS pins and route ordering.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | FK -> `core.businesses(id)` |
| `customer_id` | `UUID` | NO | — | FK -> `crm.customers(id)` ON DELETE CASCADE |
| `delivery_zone_id` | `UUID` | YES | NULL | FK -> `config.delivery_zones(id)` |
| `label` | `VARCHAR(50)` | NO | `'Home'` | e.g. `'Head Office'`, `'Floor 4 Kitchen'` |
| `street` | `VARCHAR(250)` | NO | — | Street address |
| `building` | `VARCHAR(150)` | YES | NULL | Building / Plaza name |
| `floor` | `VARCHAR(20)` | YES | NULL | Floor number |
| `has_elevator` | `BOOLEAN` | NO | `true` | Elevator availability flag |
| `latitude` | `DECIMAL(10,7)`| YES | NULL | GPS latitude for route navigation |
| `longitude` | `DECIMAL(10,7)`| YES | NULL | GPS longitude for route navigation |
| `delivery_instructions`| `VARCHAR(500)`| YES | NULL | Delivery notes for driver |
| `route_stop_sequence`| `INT` | YES | NULL | Sequence number on regular route |
| `is_default` | `BOOLEAN` | NO | `false` | Default shipping address |
| `is_deleted` | `BOOLEAN` | NO | `false` | Soft-delete flag |

---

### Table 6.3: `crm.customer_onboarding_history`
*Derived from `CandidateOnboardingHistory.sql` in `sch`.* Multi-stage onboarding & offboarding tracker.

- `id`: `UUID` PK
- `business_id`: `UUID`
- `customer_id`: `UUID` FK -> `crm.customers(id)`
- `stage_id`: `INT` (`1=Inquiry, 2=AddressVerified, 3=DepositCollected, 4=InitialBottlesIssued, 5=Active, 6=ClosureRequested, 7=BottlesRecovered, 8=DepositRefunded`)
- `stage_name`: `VARCHAR(100)`
- `stage_completion_date`: `TIMESTAMPTZ`
- `status_id`: `INT`
- `status_name`: `VARCHAR(100)`
- `action_details`: `TEXT`
- `created_on`, `created_by`, `is_deleted`

---

## Schema 7: `catalog` & `inventory` (Products, Plant Production, Stock & Bottle Asset Ledger)

### Tables 7.1 - 7.2: `catalog.categories` & `catalog.products`
- **`catalog.categories`**: `id`, `business_id`, `name`, `slug`, `display_order`, `is_deleted`.
- **`catalog.products`**:
  - `id`: `UUID` PK
  - `business_id`: `UUID`
  - `category_id`: `UUID` FK -> `catalog.categories(id)`
  - `sku`: `VARCHAR(50)` NOT NULL (`UNIQUE(business_id, sku)`)
  - `name`: `VARCHAR(200)` NOT NULL
  - `size_liters`: `DECIMAL(5,2)` NOT NULL (`19.00`, `12.00`, `6.00`, `1.50`, `0.50`)
  - `is_returnable_bottle`: `BOOLEAN` NOT NULL DEFAULT `true`
  - `selling_price`: `DECIMAL(18,2)` NOT NULL
  - `deposit_price`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
  - `cost_price`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
  - `late_return_penalty`: `DECIMAL(18,2)` DEFAULT `0.00`
  - `damaged_penalty`: `DECIMAL(18,2)` DEFAULT `0.00`
  - `is_active`: `BOOLEAN` DEFAULT `true`
  - `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted`

---

### Table 7.3: `inventory.branch_inventories`
Tracks stock physically present at each branch/depot across six states:

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Depot ID (`UNIQUE(branch_id, product_id)`) |
| `product_id` | `UUID` | NO | — | Product ID |
| `full_quantity` | `INT` | NO | `0` | Filled & sealed bottles ready for delivery |
| `empty_clean_quantity` | `INT` | NO | `0` | Washed empty bottles ready for filling |
| `empty_dirty_quantity` | `INT` | NO | `0` | Returned from customers, awaiting wash |
| `damaged_quantity` | `INT` | NO | `0` | Cracked bottles awaiting repair or scrap |
| `in_market_quantity` | `INT` | NO | `0` | Bottles currently with customers of this branch |
| `on_vehicle_quantity` | `INT` | NO | `0` | Bottles currently loaded on delivery vehicles |
| `low_stock_threshold` | `INT` | NO | `20` | Trigger level for low stock alert |
| `modified_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Last stock update |

---

### Table 7.4: `inventory.bottle_ledger_entries` (Immutable Double-Entry Asset Ledger)
Every bottle movement in the company creates an immutable row.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Branch ID |
| `shift_id` | `UUID` | YES | NULL | Operating Shift ID |
| `customer_id` | `UUID` | NO | — | FK -> `crm.customers(id)` |
| `order_id` | `UUID` | YES | NULL | Linked order |
| `delivery_id` | `UUID` | YES | NULL | Linked delivery |
| `product_id` | `UUID` | NO | — | Bottle product (19L, 12L) |
| `transaction_type` | `VARCHAR(40)` | NO | — | `DELIVERY_ISSUANCE`, `DELIVERY_RETURN`, `DAMAGED_RETURN`, `LOST_PENALTY`, `DEPOSIT_PAID`, `DEPOSIT_REFUNDED`, `AUDIT_CORRECTION` |
| `full_delivered` | `INT` | NO | `0` | Full bottles handed over |
| `empty_returned` | `INT` | NO | `0` | Empty bottles collected |
| `damaged_count` | `INT` | NO | `0` | Cracked bottles returned |
| `lost_count` | `INT` | NO | `0` | Declared lost bottles |
| `deposit_added` | `DECIMAL(18,2)`| NO | `0.00` | Security deposit received |
| `deposit_refunded` | `DECIMAL(18,2)`| NO | `0.00` | Security deposit refunded |
| `running_bottle_balance`| `INT` | NO | — | Customer bottle count immediately after this transaction |
| `running_deposit_balance`| `DECIMAL(18,2)`| NO | — | Customer deposit liability immediately after this transaction |
| `source` | `VARCHAR(50)` | NO | `'DriverApp'` | `'DriverApp'`, `'AdminDesk'`, `'POS'` |
| `change_reason` | `VARCHAR(250)` | YES | NULL | Reason for audit corrections |
| `performed_by_id` | `UUID` | NO | — | Driver or Staff User ID |
| `created_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Immutable timestamp |

---

## Schema 8: `logistics` (Orders, Gate Passes, Delivery Runs & Bitmask Subscriptions)

### Table 8.1: `logistics.subscription_recurrence_rules`
*Directly derived from `EventRecurrenceRule.sql` in `sch`.* Bitmask recurring delivery schedule.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `customer_id` | `UUID` | NO | — | FK -> `crm.customers(id)` |
| `address_id` | `UUID` | NO | — | FK -> `crm.customer_addresses(id)` |
| `shift_id` | `UUID` | NO | — | Delivery shift |
| `recurrence_type` | `SMALLINT` | NO | — | `1=Daily, 2=Weekly, 3=Monthly, 4=AlternateDays` |
| `interval` | `INT` | NO | `1` | Interval step (e.g. every 1 week) |
| `days_of_week_mask`| `SMALLINT` | YES | NULL | **Bitmask**: `Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64` (e.g. Mon+Thu = `1+8 = 9`) |
| `day_of_month` | `SMALLINT` | YES | NULL | Day of month (for monthly delivery) |
| `range_start_date` | `DATE` | NO | — | Subscription start date |
| `range_end_date` | `DATE` | YES | NULL | Subscription end date |
| `occurrence_limit` | `INT` | YES | NULL | Max occurrences before auto-expiry |
| `status` | `VARCHAR(20)` | NO | `'ACTIVE'` | `ACTIVE`, `PAUSED`, `CANCELLED` |
| `paused_from_date` | `DATE` | YES | NULL | Vacation pause start date |
| `paused_to_date` | `DATE` | YES | NULL | Vacation pause end date |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

---

### Table 8.2: `logistics.subscription_occurrences`
*Directly derived from `EventOccurrence.sql` in `sch`.* Materialized delivery slots with exception overrides.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `subscription_rule_id`| `UUID` | NO | — | FK -> `logistics.subscription_recurrence_rules(id)` |
| `occurrence_date` | `DATE` | NO | — | Exact delivery date |
| `shift_id` | `UUID` | NO | — | Delivery shift |
| `status_id` | `SMALLINT` | NO | `1` | `1=Scheduled, 2=OrderCreated, 3=Skipped, 4=Delivered, 5=Failed` |
| `is_exception` | `BOOLEAN` | NO | `false` | True if date was skipped or extra bottles requested |
| `address_id_override`| `UUID` | YES | NULL | Drop address override |
| `quantity_override`| `INT` | YES | NULL | Bottle quantity override for this single date |
| `generated_order_id`| `UUID` | YES | NULL | Order created from this slot |
| `notes` | `VARCHAR(500)` | YES | NULL | Customer notes |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

*Constraint:* `UNIQUE (subscription_rule_id, occurrence_date)` (Idempotent: prevents duplicate order generation).

---

### Table 8.3: `logistics.vehicle_gate_passes`
*Derived from `Settings.Module: Gate Pass` in `sch`.* Vehicle load sheet & daily driver settlement.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Branch ID |
| `shift_id` | `UUID` | NO | — | Operating shift |
| `driver_employee_id`| `UUID` | NO | — | FK -> `hr.employees(id)` |
| `vehicle_number` | `VARCHAR(50)` | NO | — | Truck registration number |
| `gate_pass_number` | `VARCHAR(50)` | NO | — | Unique gate pass code |
| `dispatch_date` | `DATE` | NO | `CURRENT_DATE` | Date of run |
| `full_bottles_loaded_19l` | `INT` | NO | `0` | Loaded full 19L bottles |
| `unsold_full_returned_19l`| `INT` | NO | `0` | Brought back full bottles |
| `empty_bottles_collected_19l`| `INT` | NO | `0` | Empty bottles brought back |
| `damaged_bottles_returned`| `INT` | NO | `0` | Cracked bottles |
| `expected_cash_amount`| `DECIMAL(18,2)`| NO | `0.00` | Total cash driver was supposed to collect |
| `actual_cash_handed_over`| `DECIMAL(18,2)`| NO | `0.00` | Physical cash deposited at depot |
| `cash_variance` | `DECIMAL(18,2)`| NO | `0.00` | Difference (`actual - expected`) |
| `bottle_variance` | `INT` | NO | `0` | Missing bottle count |
| `gate_out_time` | `TIMESTAMPTZ` | YES | NULL | Time truck exited plant gate |
| `gate_in_time` | `TIMESTAMPTZ` | YES | NULL | Time truck returned to plant gate |
| `verified_by_guard_id`| `UUID` | YES | NULL | Security guard user ID |
| `reconciled_by_accountant_id`| `UUID`| YES | NULL | Cashier / Accountant user ID |
| `status` | `VARCHAR(30)` | NO | `'LOADED'` | `LOADED`, `DISPATCHED`, `RETURNED`, `RECONCILED` |

---

### Tables 8.4 - 8.6: Orders, Items & Field Deliveries
- **`logistics.orders`**: `id`, `business_id`, `branch_id`, `customer_id`, `address_id`, `order_number` (Unique per business), `status` (`PENDING`, `CONFIRMED`, `PROCESSING`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `CANCELLED`), `subtotal`, `deposit_total`, `delivery_fee`, `discount_amount`, `total_amount`, `payment_status`, `payment_method`, `scheduled_date`, `preferred_time_slot`, `created_on`, `is_deleted`.
- **`logistics.order_items`**: `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `unit_deposit`, `total_price`, `is_return_expected`.
- **`logistics.deliveries`**: `id`, `business_id`, `branch_id`, `order_id` (Unique), `gate_pass_id`, `driver_user_id`, `scheduled_date`, `stop_order`, `status`, `otp_code`, `otp_verified`, `proof_photo_url`, `cash_collected`, `empty_bottles_collected`, `delivered_lat`, `delivered_lng`, `failure_reason`, `dispatched_at`, `delivered_at`.

---

## Schema 9: `billing` (Challan Vouchers, Arrears, Discount Packages & Payments)

### Tables 9.1 - 9.2: Charge Types & Discount Packages
*Derived from `FeeType.sql`, `FeeDiscountPackages.sql`, `FeeDiscountPackageDetail.sql` in `sch`.*

- **`billing.charge_types`**: `id`, `business_id`, `code` (`WATER_REFILL_19L`, `BOTTLE_DEPOSIT_19L`, `DISPENSER_RENTAL`, `DELIVERY_FEE`, `FLOOR_CARRY_FEE`, `LATE_FEE`), `name`, `is_refundable_deposit`, `gl_account_code`, `is_active`.
- **`billing.discount_packages`**: `id`, `business_id`, `branch_id`, `package_name`, `display_name`, `is_deleted` (`UNIQUE(branch_id, package_name) WHERE is_deleted = false`).
- **`billing.discount_package_details`**: `id`, `discount_package_id`, `charge_type_id`, `discount_type` (`PERCENTAGE`, `FIXED_AMOUNT`), `discount_value`, `is_deleted`.

---

### Table 9.3: `billing.voucher_processing_runs`
*Derived from `FeeVoucherProcessing.sql` in `sch`.* Tracks bulk monthly billing generation runs across depots and zones.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Branch ID |
| `shift_id` | `UUID` | YES | NULL | Shift filter |
| `billing_month` | `DATE` | NO | — | Monthly billing cycle (e.g. `2026-11-01`) |
| `issue_date` | `DATE` | NO | — | Date printed on challan |
| `due_date` | `DATE` | NO | — | Payment deadline date |
| `validity_date` | `DATE` | YES | NULL | Bank challan expiry date |
| `delivery_zone_ids` | `VARCHAR(500)`| YES | NULL | Filtered zones |
| `customer_ids` | `TEXT` | YES | NULL | Filtered customer IDs |
| `excluded_customer_ids`| `TEXT` | YES | NULL | Excluded customer IDs |
| `status_id` | `SMALLINT` | NO | `1` | `1=Queued, 2=Processing, 3=Completed, 4=Failed` |
| `total_vouchers_generated`| `INT` | NO | `0` | Total bills generated |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

---

### Table 9.4: `billing.billing_vouchers`
*Directly derived from `FeeVoucher.sql` in `sch`.* Monthly and Order Invoicing Challan with Arrears & Deposits.

| Column | Type | Nullable | Default | Constraints & Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Branch ID |
| `processing_run_id`| `UUID` | YES | NULL | Link to batch run |
| `customer_id` | `UUID` | NO | — | FK -> `crm.customers(id)` |
| `voucher_no` | `VARCHAR(100)` | NO | — | Unique challan number (e.g. `VCH-202611-00104`) |
| `issue_date` | `TIMESTAMPTZ` | NO | — | Issue timestamp |
| `due_date` | `TIMESTAMPTZ` | NO | — | Due timestamp |
| `validity_date` | `TIMESTAMPTZ` | YES | NULL | Final bank acceptance date |
| `billing_month` | `DATE` | NO | — | Billing month |
| `challan_type` | `VARCHAR(50)` | NO | `'MonthlyPostpaid'` | `'MonthlyPostpaid'`, `'SingleOrder'`, `'DepositChallan'` |
| `gross_amount` | `DECIMAL(18,2)`| NO | `0.00` | Water & accessories subtotal |
| `total_discount` | `DECIMAL(18,2)`| NO | `0.00` | Package discount deducted |
| `total_additional_discount`| `DECIMAL(18,2)`| NO | `0.00`| Special customer concession |
| `late_fee` | `DECIMAL(18,2)`| NO | `0.00` | Surcharge applied after `due_date` |
| `previous_arrears` | `DECIMAL(18,2)`| NO | `0.00` | **Unpaid arrears from previous months!** |
| `deposit_liability_amount`| `DECIMAL(18,2)`| NO | `0.00`| Segregated refundable bottle deposits |
| `payable_amount` | `DECIMAL(18,2)`| NO | `0.00` | **Total amount customer must pay** |
| `paid_amount` | `DECIMAL(18,2)`| NO | `0.00` | Sum of payments received against this voucher |
| `paid_date` | `TIMESTAMPTZ` | YES | NULL | Date voucher became fully settled |
| `payment_status` | `VARCHAR(50)` | NO | `'Unpaid'` | `'Unpaid'`, `'PartiallyPaid'`, `'Paid'`, `'Overdue'`, `'Voided'` |
| `payment_method` | `VARCHAR(50)` | YES | NULL | Settled via Cash, Bank, Easypaisa, JazzCash |
| `receipt_no` | `VARCHAR(100)` | YES | NULL | Bank or digital receipt number |
| `remarks` | `VARCHAR(500)` | YES | NULL | Voucher notes |
| `created_on`, `created_by`, `modified_on`, `modified_by`, `is_deleted` | — | — | — | Universal Audit Quintet |

*Constraint:* `UNIQUE (customer_id, billing_month, challan_type) WHERE is_deleted = false`

---

### Tables 9.5 - 9.6: Line Item Details & Payments
*Derived from `FeeVoucherDetail.sql` & `FeeVoucherPayment.sql` in `sch`.*

- **`billing.billing_voucher_details`**: `id`, `billing_voucher_id`, `charge_type_id`, `order_id` (Nullable link to specific order), `quantity`, `unit_rate`, `amount`, `discounted_amount`, `additional_discount`, `revised_amount`, `remarks`, `created_on`, `is_deleted`.
- **`billing.billing_voucher_payments`**: `id`, `business_id`, `billing_voucher_id`, `payment_amount`, `payment_date`, `received_by_user_id` (Driver or Cashier), `reconciled_by_user_id` (Accountant), `reconciled_on`, `payment_mode` (`Cash`, `Bank`, `Easypaisa`, `JazzCash`), `receipt_no`, `remarks`, `is_deleted`.

---

## Schema 10: `notify` (Multi-Channel Notification Outbox & Idempotent Scheduler)

*Directly derived from `[Notify].*` tables in `sch`.*

### Table 10.1: `notify.notification_tenant_settings`
*Derived from `Notify.NotificationTenantSetting.sql` in `sch`.* Per-tenant notification rules & quiet hours.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `business_id` | `UUID` | NO | — | Primary Key (1 row per tenant) |
| `is_enabled` | `BOOLEAN` | NO | `true` | Master switch |
| `is_sms_enabled` | `BOOLEAN` | NO | `false` | SMS notifications |
| `is_whatsapp_enabled`| `BOOLEAN` | NO | `false` | WhatsApp notifications |
| `is_email_enabled` | `BOOLEAN` | NO | `true` | Email notifications |
| `is_in_app_enabled` | `BOOLEAN` | NO | `true` | Mobile/web bell alerts |
| `default_language_code`| `VARCHAR(10)`| NO | `'en'` | Default language (`'en'`, `'ur'`) |
| `time_zone_id` | `VARCHAR(100)`| YES | NULL | Local timezone |
| `quiet_hours_start` | `TIME(0)` | YES | NULL | Start of quiet hours (e.g. `21:00:00`) |
| `quiet_hours_end` | `TIME(0)` | YES | NULL | End of quiet hours (e.g. `07:30:00`) |
| `sms_provider_code` | `VARCHAR(50)` | YES | NULL | SMS gateway provider |
| `sms_sender_id` | `VARCHAR(50)` | YES | NULL | Masking / Sender ID |
| `daily_sms_limit` | `INT` | YES | NULL | Quota limit |
| `whatsapp_phone_number_id`| `VARCHAR(100)`| YES| NULL | Meta WhatsApp Cloud API Phone ID |
| `email_from_address`| `VARCHAR(256)`| YES | NULL | Outbound email sender |
| `email_from_name` | `VARCHAR(150)`| YES | NULL | Outbound sender name |
| `modified_on`, `modified_by` | — | — | — | Last update |

---

### Tables 10.2 - 10.5: Templates, Deliveries & Idempotent Scheduler
- **`notify.notification_settings`**: `(business_id, notification_type_id)` Composite PK, `is_sms_enabled`, `is_whatsapp_enabled`, `is_email_enabled`, `is_in_app_enabled`, `modified_on`.
- **`notify.notification_templates`**: `id`, `business_id` (NULL = System default, UUID = Tenant override), `notification_type_id`, `notification_channel_id` (`1=SMS, 2=WhatsApp, 3=Email, 4=InApp`), `language_code`, `subject`, `body`, `action_url`, `is_html`, `version`, `is_active`.
- **`notify.notification_deliveries`**: Outbox delivery queue with retry logic: `notification_delivery_id` (`BIGINT` PK), `business_id`, `user_id`, `notification_channel_id`, `recipient_address`, `rendered_subject`, `rendered_body`, `status` (`0=Queued, 1=Sending, 2=Sent, 3=Delivered, 4=Read, 5=Retry, 6=Failed, 7=QuietHours`), `attempt_count`, `next_retry_on`, `last_attempt_on`, `provider_code`, `provider_message_id`, `error_code`, `queued_on`, `sent_on`, `delivered_on`, `read_on`.
- **`notify.schedule_rules` & `notify.schedule_runs`**:
  - `schedule_rules`: `id`, `business_id`, `notification_type_id`, `frequency` (`1=5Min, 2=Hourly, 3=Daily, 4=Weekly, 5=Monthly`), `run_at_time`, `offset_value` (e.g. 3 days before voucher due date).
  - `schedule_runs`: `id`, `schedule_rule_id`, `business_id`, `window_key` (`VARCHAR(30)` e.g. `'20261112'`), `status` (`1=Running, 2=Completed, 3=Failed`), `started_on`, `finished_on`, `candidate_count`, `sent_count`, `failed_count`.
  - **Deduplication Constraint:** `UNIQUE (schedule_rule_id, business_id, window_key)`.

---

## Schema 11: `audit` & `log` (Snapshots, Field Diffs, History & Mobile Telemetry)

### Table 11.1: `audit.bottle_ledger_audits`
*Derived from `ResultDetailAudit.sql` in `sch`.* Immutable field diff whenever bottle counts or deposits are corrected.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | NO | `IDENTITY` | Primary Key |
| `bottle_ledger_entry_id`| `UUID` | YES | NULL | Linked ledger entry |
| `customer_id` | `UUID` | NO | — | Customer affected |
| `order_id` | `UUID` | YES | NULL | Order affected |
| `old_full_delivered`| `INT` | YES | NULL | Previous value |
| `new_full_delivered`| `INT` | YES | NULL | Revised value |
| `old_empty_returned`| `INT` | YES | NULL | Previous value |
| `new_empty_returned`| `INT` | YES | NULL | Revised value |
| `old_damaged_count` | `INT` | YES | NULL | Previous value |
| `new_damaged_count` | `INT` | YES | NULL | Revised value |
| `old_deposit_added` | `DECIMAL(18,2)`| YES | NULL | Previous deposit |
| `new_deposit_added` | `DECIMAL(18,2)`| YES | NULL | Revised deposit |
| `change_reason` | `VARCHAR(250)` | NO | — | **Mandatory reason for audit correction** |
| `source` | `VARCHAR(50)` | NO | `'AdminCorrection'`| Change origin |
| `changed_by` | `UUID` | NO | — | Accountant / Manager user ID |
| `changed_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Timestamp |

---

### Table 11.2: `audit.plant_daily_snapshots`
*Derived from `ResultSnapshot.sql` in `sch`.* Daily depot & bottle market freeze.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | Primary Key |
| `business_id` | `UUID` | NO | — | Tenant ID |
| `branch_id` | `UUID` | NO | — | Branch ID |
| `snapshot_date` | `DATE` | NO | — | Snapshot date |
| `version_number` | `INT` | NO | `1` | Snapshot version |
| `snapshot_type` | `VARCHAR(50)` | NO | `'ShiftClose'` | `'ShiftClose'`, `'DailyEndClose'`, `'MonthlyClose'` |
| `total_full_in_plant`| `INT` | NO | — | Full bottles in plant |
| `total_empty_in_plant`| `INT` | NO | — | Empty bottles in plant |
| `total_damaged_in_plant`| `INT` | NO | — | Damaged bottles in plant |
| `total_bottles_in_market`| `INT` | NO | — | Total bottles currently held by all customers |
| `total_deposit_liability`| `DECIMAL(18,2)`| NO | — | Total deposit liability held in company escrow |
| `total_cash_collected`| `DECIMAL(18,2)`| NO | — | Day's total cash collections |
| `total_unpaid_arrears`| `DECIMAL(18,2)`| NO | — | Customer outstanding receivables balance |
| `created_by` | `UUID` | NO | — | Shift Incharge ID |
| `created_on` | `TIMESTAMPTZ(3)`| NO | `NOW()` | Audit timestamp |

---

### Tables 11.3 - 11.5: Customer Shadow History, Mobile Logs & Error Logs
- **`audit.customer_histories`**: Populated via TypeORM `EntitySubscriberInterface` on `crm.customers`: `history_id`, `action_date`, `action` (`'I'`, `'U'`, `'D'`), `db_user_name`, `user_machine`, plus full column snapshot of customer row before/after change.
- **`log.mobile_log_batches` & `log.mobile_log_entries`**: Offline Driver App telemetry ingestion: `batch_id`, `platform`, `os_version`, `model_name`, `app_version`, `driver_user_id`, `timestamp`, `level`, `screen`, `action`, `message`, `payload`.
- **`log.error_logs`**: `id`, `business_id`, `error_message`, `error_type`, `error_source`, `stack_trace`, `user_id`, `input`, `severity` (`'Critical'`, `'Error'`, `'Warning'`), `created_on`.

---

## 🚀 Execution Instruction for Next Step

Jab bhi hum implementation shuru karein:
1. **Phase 1** se shuru karenge: Sirf **`security` aur `settings` schemas** ke TypeORM entity models banayeinge (`User`, `Role`, `Permission`, `UserRoles`, `RolePermission`, `ErpModule`, `Menu`, `MenuPermission`, `Configuration`, `UserSession`, `PasswordResetRequest`, `UserSubOrdinates`).
2. Har phase complete hone par type safety verify karenge (`npx tsc --noEmit`), testing run karenge, aur `.agents/context/FEATURE_LOG.md` update karenge.


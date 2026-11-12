# AquaFlow — Enterprise ERP Database Blueprint (Derived from `sch/Security` & `sch/API`)

> **Role:** Principal Database Design Engineer & Enterprise ERP Architect  
> **Reference Architectures Analyzed:** `d:\Backend Portfolio\sch\Security\Database` & `d:\Backend Portfolio\sch\API\Database`  
> **Target System:** **AquaFlow ERP** (Multi-Tenant Water Supply, Purification, Bottle Asset Tracking, Logistics & Financial ERP)

---

## 🧠 1. Database Engineering Analysis of `sch` (`Security` + `API`)

Upon deeply inspecting the SQL scripts, schemas, tables, constraints, filtered indexes, triggers, and stored procedures in `sch\Security\Database` and `sch\API\Database`, eight foundational **ERP-Grade Database Design Patterns** emerge that separate a real enterprise ERP from a basic CRUD web app:

### Pattern 1: Bounded-Context Schema Partitioning
Instead of dumping 80+ tables into a single flat namespace, `sch` segregates tables by domain schema:
- **`[Security]`**: Authentication, Users, Roles, Granular Permissions, Active Sessions, Password OTP Requests, Subordinate Hierarchies, and Multi-Scope Assignments (Client/Shift/Department).
- **`[Settings]`**: Dynamic ERP Modules, Multi-Level Navigation Menus (`Parent -> SubParent -> Menu`), Breadcrumbs, and Page-Level Key-Value Configurations with Chart-of-Accounts (`IsCOAConfig`) hooks.
- **`[Config]`**: Master Reference Data (Countries, States, Cities, TimeZones, Designations, Employment Types, Employees/HR Master, Status Lookups).
- **`[Notify]`**: Multi-Channel Notification Outbox (SMS, WhatsApp, Email, In-App), Per-Tenant Channel Settings, Quiet Hours, Multi-Language Versioned Templates, and Idempotent Scheduled Job Runs (`ScheduleRule` + `ScheduleRun` with `WindowKey`).
- **`[Log]`**: Mobile Field App Batch Telemetry (`MobileLogBatch`, `MobileLogEntry`), Ingestion Settings, and Centralized `ErrorLog`.
- **`[Core / Operations]`**: Multi-tier organizational hierarchy (`School -> Campus -> SchoolShift`), Batch Voucher Billing (`FeeVoucher`, `FeeVoucherDetail`, `FeeVoucherPayment`, `FeeVoucherProcessing`), Bitmask Recurrence Rules (`EventRecurrenceRule`, `EventOccurrence`), Shadow History Tables (`_History`), and Point-in-Time Immutable Snapshots.

### Pattern 2: Soft-Delete + Filtered Unique Indexes
In `sch` (`School.sql`, `Campus.sql`, `FeeDiscountPackages.sql`), records are never destructively deleted (`IsDeleted BIT NOT NULL DEFAULT 0`). Crucially, uniqueness is enforced via **Filtered Unique Indexes** (`WHERE IsDeleted = 0`):
- Example from `School.sql`: `CREATE UNIQUE INDEX UQ_School_SchoolCode ON dbo.School (SchoolCode) WHERE SchoolCode IS NOT NULL AND IsDeleted = 0;`
- Example from `Campus.sql`: `CREATE UNIQUE INDEX UQ_Campus_HeadOffice ON dbo.Campus (SchoolId) WHERE IsHeadOffice = 1 AND IsDeleted = 0;` (Guarantees at most ONE active Head Office per tenant!).

### Pattern 3: Universal 5-Column ERP Audit Trail
Every operational and configuration table in `sch` carries five mandatory audit attributes:
- `CreatedBy` (User ID)
- `CreatedOn` (`DATETIME2(3)` / UTC timestamp)
- `ModifiedBy` / `LastModifiedBy` (Nullable User ID)
- `ModifiedOn` / `LastModifiedOn` (`DATETIME2(3)`)
- `IsDeleted` / `Active` (`BOOLEAN` soft-delete and status flags)

### Pattern 4: Separation of Login Identity (`Security.Users`) from HR Employee Master (`Config.Employee`)
In `sch`, `Security.Users` only stores authentication credentials, lockout state, and session identity. `[Config].[Employee]` stores HR, CNIC, Payroll (`GrossPay`, `OtherAll`), Designation, Department, Hire/Resign dates, Bank Account, EOBI, and Manager hierarchy, with an optional `LoginUserId` FK to `Security.Users`.
- **Why this is vital for AquaFlow ERP:** A water bottling plant has plant loaders, bottle washers, helper boys, and security guards who need HR/Payroll/Attendance tracking in the ERP but do NOT need app login accounts, alongside Managers, Accountants, and Delivery Drivers who DO have app logins!

### Pattern 5: Dynamic Module & Menu-Driven RBAC (`Settings.Module`, `Settings.Menu`, `Security.MenuPermission`)
In `sch`, the UI sidebar and page access are driven from the database. SaaS plans unlock specific `Settings.Module` rows, and roles/users are granted `Security.MenuPermission` and `Security.RolePermission`.

### Pattern 6: Bitmask Recurrence & Exception Occurrences (`EventRecurrenceRule` & `EventOccurrence`)
Instead of fragile string arrays for recurring schedules, `sch` uses `DaysOfWeekMask TINYINT` (`Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64`) and materializes scheduled occurrences in `EventOccurrence` with `IsException BIT` and `VenueIdOverride`.
- **Why this is vital for AquaFlow ERP:** Water subscriptions run on exact weekday combinations (e.g., Mon/Wed/Fri = `1+4+16 = 21`). When a customer goes on vacation or orders extra bottles for one specific Friday, `SubscriptionOccurrence` marks `IsException = true` without corrupting the master recurrence rule!

### Pattern 7: Voucher-Based Billing with Arrears, Discounts & Batch Processing (`FeeVoucher*`)
`sch` separates recurring fee setup (`FeeSetup`), discount packages (`FeeDiscountPackage`), bulk billing batch runs (`FeeVoucherProcessing`), monthly vouchers (`FeeVoucher` with `PreviousArrears`, `LateFee`, `GrossAmount`, `TotalDiscount`, `PayableAmount`, `PaidAmount`), line items (`FeeVoucherDetail`), and multi-installment payment receipts (`FeeVoucherPayment`).
- **Why this is vital for AquaFlow ERP:** Corporate water clients and monthly residential subscribers receive monthly water bills (Challans/Vouchers) that include previous unpaid arrears, bottle deposit charges, dispenser rental fees, and corporate package discounts.

### Pattern 8: Three-Layer Auditability (Shadow History + Field Diff Audit + Point-in-Time Snapshots)
1. **Row History (`Student_History`)**: Captures full row before/after on `I/U/D` with `ActionDate`, `Action`, `DBUserName`, `UserMachine`.
2. **Field Diff Audit (`ResultDetailAudit`)**: Captures `OldValue` vs `NewValue`, `ChangeReason`, `Source`, `ChangedBy`, `ChangedOn`.
3. **Immutable Snapshots (`ResultSnapshot`)**: Freezes aggregate metrics at a point in time (`VersionNumber`, `SnapshotType`).

---

## 🗺️ 2. Mapping `sch` Tables to AquaFlow ERP

| `sch` Source Schema & Table | AquaFlow ERP Target Schema & Table | Purpose in AquaFlow Water ERP |
| :--- | :--- | :--- |
| **`[Security].[Users]`** | `security.users` | Global authentication identity, lockout status, email/phone verification |
| **`[Security].[Role]`** | `security.roles` | System & tenant-customizable roles (Owner, Plant Manager, Dispatcher, Driver, Accountant, Customer) |
| **`[Security].[Permission]`** | `security.permissions` | Atomic capability keys (`orders.create`, `bottle_ledger.override`, `vouchers.generate`) + `isSuperAdminOnly` |
| **`[Security].[UserRoles]`** | `security.user_roles` | Many-to-many mapping of Users to Roles within a Tenant |
| **`[Security].[RolePermission]`** | `security.role_permissions` | Grants atomic permissions to Roles |
| **`[Settings].[Module]`** | `settings.erp_modules` | Licensed ERP modules (`POS_ORDERING`, `BOTTLE_LEDGER`, `FLEET_DISPATCH`, `HR_PAYROLL`, `PROCUREMENT`, `GEO_FENCING`) |
| **`[Settings].[Menu]`** | `settings.menus` | Dynamic sidebar menu hierarchy (`parent`, `subParent`, `url`, `iconClass`, `orderNo`, `breadcrumb`, `permissionId`) |
| **`[Security].[MenuPermission]`** | `security.menu_permissions` | Controls which roles/users can see and access specific ERP menus |
| **`[Settings].[Configuration]`** | `settings.configurations` | Dynamic tenant/page settings (`key`, `defaultValue`, `keyType`, `isCOAConfig`, `multiValue`) |
| **`[Security].[UserSessions]`** | `security.user_sessions` | Active JWT/refresh sessions, device headers, IP address, cached permission claims |
| **`[Security].[PasswordResetRequest]`** | `security.password_reset_requests` | OTP & reset token lifecycle (`otp`, `otpExpiry`, `resetToken`, `isUsed`) |
| **`[Security].[UserSubOrdinates]`** | `security.user_subordinates` | Supervisor-to-subordinate hierarchy (e.g., Fleet Manager -> Zone Supervisors -> Delivery Drivers) |
| **`[Security].[UserAssignedClients]`** | `security.user_assigned_branches` | Restricts staff/managers to specific water plants or distribution depots |
| **`[Security].[UserAssignedSchoolShifts]`** | `security.user_assigned_shifts` | Restricts dispatchers and drivers to specific operating shifts (Morning, Evening) |
| **`[Security].[UserAssignedSections]`** | `security.user_assigned_zones` | Assigns delivery drivers & sales officers to specific geographic delivery zones/routes |
| **`[dbo].[School]`** | `core.businesses` | Master Water Business Tenant (`businessCode`, `dueDayOfMonth`, `voucherValidityDays`, `themePrimaryColor`, `themeSecondaryColor`) |
| **`[dbo].[Campus]`** | `core.branches` | Bottling Plant / Distribution Depot (`isHeadOffice`, `timeZoneId`, `invoicePrefix`, `whatsAppNumber`, `officeHours`, `bankAccountNumber`) |
| **`[dbo].[SchoolShift]`** | `core.operating_shifts` | Delivery & Plant Shifts (`branchId`, `shiftName`, `startTime`, `endTime`, `shiftInchargeId`) |
| **`[Config].[Continent/Country/State/City]`** | `config.countries`, `states`, `cities`, `delivery_zones` | Standardized geographic hierarchy + delivery route zones & geofences |
| **`[Config].[TimeZone]`** | `config.time_zones` | Timezone catalog (`Pakistan Standard Time GMT+05:00`, `UTC`) for accurate shift & cron execution |
| **`[Config].[Employee]`** | `hr.employees` | Complete Staff & Driver HR Profile (`code`, `cnic`, `cnicExpiryDate`, `loginUserId`, `managerId`, `designationId`, `employmentTypeId`, `grossPay`, `perBottleCommission`, `bankAccountNo`) |
| **`[dbo].[Candidate]` & `OnboardingStages`** | `hr.driver_onboarding_history` & `customer_onboarding_stages` | Multi-stage onboarding pipeline for corporate water accounts or driver verification (CNIC check, license check, security deposit) |
| **`[dbo].[LeaveRequest]` & `Attendance`** | `hr.employee_attendances` & `hr.leave_requests` | Driver & plant staff daily attendance and leave approval workflow (auto-unassigns driver routes when on approved leave!) |
| **`[dbo].[FeeType]` & `FeeSetup`** | `billing.charge_types` & `billing.customer_rate_cards` | Charge types (`WATER_REFILL`, `BOTTLE_DEPOSIT`, `DISPENSER_RENTAL`, `DELIVERY_FEE`, `LATE_SURCHARGE`, `DAMAGED_BOTTLE_PENALTY`) |
| **`[dbo].[FeeDiscountPackage*]`** | `billing.discount_packages` & `discount_package_details` | Tiered corporate, institutional, and VIP residential discount packages |
| **`[dbo].[FeeVoucherProcessing]`** | `billing.voucher_processing_runs` | Batch monthly invoice generation job tracker (`branchId`, `shiftId`, `billingMonth`, `status`, `customerIds`, `excludedCustomerIds`) |
| **`[dbo].[FeeVoucher]`** | `billing.billing_vouchers` | Monthly/Order Billing Challan (`voucherNo`, `issueDate`, `dueDate`, `validityDate`, `billingMonth`, `grossAmount`, `totalDiscount`, `lateFee`, `previousArrears`, `payableAmount`, `paidAmount`, `paymentStatus`) |
| **`[dbo].[FeeVoucherDetail]`** | `billing.billing_voucher_details` | Line-item breakdown on a billing voucher (`chargeTypeId`, `amount`, `discountedAmount`, `additionalDiscount`, `revisedAmount`) |
| **`[dbo].[FeeVoucherPayment]`** | `billing.billing_voucher_payments` | Multi-part payment receipts against a voucher (`paymentAmount`, `paymentDate`, `receivedBy`, `paymentMode`, `receiptNo`) |
| **`[dbo].[EventRecurrenceRule]`** | `logistics.subscription_recurrence_rules` | Bitmask recurring delivery schedule (`recurrenceType`, `interval`, `daysOfWeekMask`, `dayOfMonth`, `rangeStartDate`, `rangeEndDate`) |
| **`[dbo].[EventOccurrence]`** | `logistics.subscription_occurrences` | Materialized delivery calendar slots (`occurrenceDate`, `statusId`, `isException`, `addressIdOverride`, `quantityOverride`) |
| **`[dbo].[ResultDetailAudit]`** | `audit.bottle_ledger_audits` | Field-level old vs. new audit log whenever bottle counts, deposits, or prices are adjusted (`oldFull`, `newFull`, `oldEmpty`, `newEmpty`, `changeReason`, `source`, `changedBy`) |
| **`[dbo].[ResultSnapshot]`** | `audit.inventory_financial_snapshots` | Immutable Daily Plant Close & Monthly Financial Freeze snapshots (`versionNumber`, `snapshotType`, `totalFullBottles`, `totalEmptyBottles`, `totalMarketBottles`, `totalEscrowDeposit`) |
| **`[dbo].[Student_History]`** | `audit.customer_histories` | Trigger/hook-populated row history of customer balance and profile changes (`action` `'I'/'U'/'D'`, `actionDate`, `dbUserName`) |
| **`[Notify].[Notification*]` (7 Tables)** | `notify.*` (7 Tables) | Enterprise Multi-Channel Notification & Idempotent Scheduler Engine (`NotificationType`, `NotificationTemplate`, `NotificationTenantSetting`, `NotificationSetting`, `NotificationDelivery`, `ScheduleRule`, `ScheduleRun`) |
| **`[Log].[MobileLog*]` & `ErrorLog`** | `log.mobile_log_batches`, `mobile_log_entries`, `error_logs` | Offline Driver App telemetry ingestion & centralized backend exception logging |

---

## 🗄️ 3. Detailed Table & Attribute Specifications for AquaFlow ERP

Below is the complete engineering specification of the tables and attributes to implement in AquaFlow to achieve true ERP maturity.

---

### 🔐 Schema 1: `security` & `settings` (Identity, Dynamic Menus, RBAC & Scopes)

#### 1.1 `security.users` (Derived from `[Security].[Users]`)
- `id`: `UUID` PK
- `userName`: `VARCHAR(50)` NOT NULL, Unique
- `email`: `VARCHAR(150)` NOT NULL (Filtered Unique Index where `email <> ''`)
- `cellPhone`: `VARCHAR(20)` NULL (Indexed for mobile login)
- `passwordHash`: `TEXT` NOT NULL (Argon2id)
- `userType`: `SMALLINT` NOT NULL (`1=SuperAdmin, 2=BusinessAdmin, 3=Employee/Driver, 4=Customer`)
- `firstName`: `VARCHAR(150)` NOT NULL
- `middleName`: `VARCHAR(150)` DEFAULT `''`
- `lastName`: `VARCHAR(150)` NOT NULL
- `imagePath`: `TEXT` NULL
- `isEmailVerified`: `BOOLEAN` NOT NULL DEFAULT `false`
- `verificationKey`: `VARCHAR(100)` NULL
- `isAccountLocked`: `BOOLEAN` NOT NULL DEFAULT `false`
- `failedLoginAttempts`: `SMALLINT` NOT NULL DEFAULT `0`
- `active`: `BOOLEAN` NOT NULL DEFAULT `true`
- `createdOn`: `TIMESTAMPTZ(3)` NOT NULL DEFAULT `NOW()`
- `createdBy`: `UUID` NULL
- `modifiedOn`: `TIMESTAMPTZ(3)` NULL
- `modifiedBy`: `UUID` NULL

#### 1.2 `security.roles` & `security.permissions` & `security.role_permissions` & `security.user_roles`
- **`security.roles`**: `id`, `businessId` (Nullable for global system roles), `name`, `code`, `description`, `active`, `createdOn`, `createdBy`, `modifiedOn`, `modifiedBy`.
- **`security.permissions`**: `id`, `moduleId` (FK -> `settings.erp_modules`), `name` (Unique, e.g. `bottle_ledger.manual_adjust`), `description`, `isSuperAdminOnly` (`BOOLEAN` DEFAULT `false`), `active`, `createdOn`, `createdBy`.
- **`security.user_roles`**: `id`, `userId`, `roleId`, `businessId`, `active`, `createdOn`, `createdBy` (`UNIQUE(userId, roleId, businessId)`).
- **`security.role_permissions`**: `id`, `roleId`, `permissionId`, `createdOn`, `createdBy` (`UNIQUE(roleId, permissionId)`).

#### 1.3 `settings.erp_modules` & `settings.menus` & `security.menu_permissions` (Derived from `[Settings].[Module]` & `[Settings].[Menu]`)
- **`settings.erp_modules`**:
  - `id`: `INT` PK
  - `code`: `VARCHAR(50)` UNIQUE (`CORE_POS`, `BOTTLE_ASSET_LEDGER`, `PLANT_PRODUCTION`, `FLEET_DISPATCH`, `SUBSCRIPTION_ENGINE`, `VOUCHER_BILLING`, `EXPENSE_COA`, `HR_PAYROLL`, `GEO_FENCING`, `DOCUMENT_ARCHIVE`)
  - `name`: `VARCHAR(100)` NOT NULL
  - `isActive`: `BOOLEAN` DEFAULT `true`
- **`settings.menus`**:
  - `id`: `INT` PK
  - `moduleId`: `INT` FK -> `settings.erp_modules(id)`
  - `name`: `VARCHAR(100)` UNIQUE NOT NULL
  - `title`: `VARCHAR(100)` NOT NULL
  - `parent`: `VARCHAR(100)` NULL
  - `subParent`: `VARCHAR(100)` NULL
  - `url`: `VARCHAR(500)` NOT NULL
  - `permissionId`: `UUID` FK -> `security.permissions(id)`
  - `orderNo`: `INT` NOT NULL
  - `currentPage`: `VARCHAR(100)` NOT NULL
  - `breadcrumb`: `VARCHAR(500)` NOT NULL
  - `isBreadcrumbEnable`: `BOOLEAN` NOT NULL DEFAULT `true`
  - `parentIconClass`: `VARCHAR(250)` NULL
  - `subParentIconClass`: `VARCHAR(250)` NULL
  - `menuIconClass`: `VARCHAR(250)` NULL
  - `userTypes`: `VARCHAR(100)` NULL (e.g. `'1,2,3'`)
  - `isVisible`: `BOOLEAN` NOT NULL DEFAULT `true`
  - `active`: `BOOLEAN` NOT NULL DEFAULT `true`
- **`security.menu_permissions`**:
  - `id`, `menuId`, `permissionId`, `active`, `createdOn`, `createdBy` (`UNIQUE(menuId, permissionId)`).

#### 1.4 `settings.configurations` & `settings.tenant_configuration_values` (Derived from `[Settings].[Configuration]`)
- **`settings.configurations`**:
  - `id`: `INT` PK
  - `menuId`: `INT` FK -> `settings.menus(id)`
  - `key`: `VARCHAR(100)` NOT NULL (`UNIQUE(menuId, key)`) — e.g. `ALLOW_NEGATIVE_STOCK`, `REQUIRE_DELIVERY_OTP`, `AUTO_APPLY_LATE_FEE`, `MAX_UNRETURNED_BOTTLES_LIMIT`
  - `defaultValue`: `VARCHAR(150)` NULL
  - `keyType`: `VARCHAR(50)` (`BOOLEAN`, `INTEGER`, `DECIMAL`, `STRING`, `JSON`)
  - `isEnabled`: `BOOLEAN` DEFAULT `true`
  - `description`: `TEXT` NULL
  - `isCOAConfig`: `BOOLEAN` DEFAULT `false` (Links setting to Chart of Accounts ledger account)
  - `multiValue`: `BOOLEAN` DEFAULT `false`
- **`settings.tenant_configuration_values`**:
  - `id`, `businessId`, `branchId` (Nullable override per branch), `configId`, `configValue`, `active`, `modifiedBy`, `modifiedOn`.

#### 1.5 `security.user_sessions` & `security.password_reset_requests`
- **`security.user_sessions`**: `id`, `userId`, `businessId`, `userType`, `sessionId` (Unique), `refreshTokenHash`, `tokenFamily`, `requestHeaders` (JSONB: User-Agent, Device Model, App Version), `ipAddress`, `permissionsSnapshot` (JSONB), `expiresAt`, `revokedAt`, `createdOn`.
- **`security.password_reset_requests`**: `id`, `userId`, `otp` (`VARCHAR(10)`), `otpExpiry` (`TIMESTAMPTZ`), `resetToken` (`VARCHAR(100)`), `isUsed` (`BOOLEAN`), `createdOn`.

#### 1.6 Hierarchy & Operational Scope Assignment Tables (Derived from `UserSubOrdinates`, `UserAssigned*`)
- **`security.user_subordinates`**: `id`, `businessId`, `userId` (Supervisor), `subordinateUserId` (Staff/Driver), `assignedOn`, `assignedBy`.
- **`security.user_assigned_branches`**: `id`, `userId`, `branchId`, `active` (`UNIQUE(userId, branchId)`).
- **`security.user_assigned_shifts`**: `id`, `userId`, `shiftId`, `active` (`UNIQUE(userId, shiftId)`).
- **`security.user_assigned_zones`**: `id`, `userId`, `deliveryZoneId`, `active` (`UNIQUE(userId, deliveryZoneId)`).

---

### 🏢 Schema 2: `core` & `config` (Multi-Tier Organization, Branches, Shifts & Geography)

#### 2.1 `core.businesses` (Derived from `[dbo].[School]`)
- `id`: `UUID` PK
- `businessCode`: `VARCHAR(50)` NOT NULL (Filtered Unique Index `WHERE isDeleted = false` — e.g. `AQUA-KHI`, used for quick tenant lookup on mobile driver/customer app!)
- `businessName`: `VARCHAR(300)` NOT NULL
- `slug`: `VARCHAR(150)` UNIQUE NOT NULL
- `businessType`: `SMALLINT` NOT NULL DEFAULT `0` (`0=RO Filtration Plant, 1=Mineral Water Bottler, 2=Regional Distributor`)
- `ownerName`: `VARCHAR(150)` NULL
- `phone`: `VARCHAR(20)` NULL
- `cellPhone`: `VARCHAR(20)` NULL
- `email`: `VARCHAR(100)` NOT NULL UNIQUE
- `website`: `VARCHAR(250)` NULL
- `logoPath`: `VARCHAR(500)` NULL
- `cityId`: `INT` FK -> `config.cities(id)`
- `state`: `VARCHAR(100)` NULL
- `currency`: `VARCHAR(10)` DEFAULT `'PKR'`
- `dueDayOfTheMonth`: `SMALLINT` DEFAULT `10` (Day of month when monthly corporate/postpaid water bills are due)
- `voucherValidityDays`: `SMALLINT` DEFAULT `15` (Days before a billing voucher expires)
- `defaultBottleDeposit19L`: `DECIMAL(18,2)` DEFAULT `1500.00`
- `defaultBottleDeposit12L`: `DECIMAL(18,2)` DEFAULT `1200.00`
- `defaultDeliveryFee`: `DECIMAL(18,2)` DEFAULT `0.00`
- `themePrimaryColor`: `VARCHAR(7)` NULL (`CHECK (themePrimaryColor ~ '^#[0-9A-Fa-f]{6}$')`)
- `themeSecondaryColor`: `VARCHAR(7)` NULL (`CHECK (themeSecondaryColor ~ '^#[0-9A-Fa-f]{6}$')`)
- `status`: `VARCHAR(30)` DEFAULT `'ACTIVE'` (`PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`)
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted` (`BOOLEAN` DEFAULT `false`)

#### 2.2 `core.branches` (Derived from `[dbo].[Campus]`)
- `id`: `UUID` PK
- `businessId`: `UUID` FK -> `core.businesses(id)`
- `branchName`: `VARCHAR(300)` NOT NULL
- `branchCode`: `VARCHAR(20)` NOT NULL
- `isHeadOffice`: `BOOLEAN` NOT NULL DEFAULT `false` (Filtered Unique Index: at most 1 Head Office per `businessId` where `isDeleted = false`)
- `address`: `VARCHAR(300)` NULL
- `cityId`: `INT` FK -> `config.cities(id)`
- `latitude`: `DECIMAL(10,7)` NULL
- `longitude`: `DECIMAL(10,7)` NULL
- `geofencePolygon`: `JSONB` NULL (Geo-fencing coordinates for plant attendance & truck dispatch!)
- `phone`: `VARCHAR(20)` NULL
- `contactPersonNumber`: `VARCHAR(20)` NULL
- `dispatchDeskPhone`: `VARCHAR(20)` NULL
- `whatsAppNumber`: `VARCHAR(20)` NULL
- `email`: `VARCHAR(100)` NULL
- `plantManagerName`: `VARCHAR(100)` NULL
- `officeHours`: `VARCHAR(500)` NULL
- `timeZoneId`: `INT` FK -> `config.time_zones(id)`
- `orderPrefix`: `VARCHAR(10)` DEFAULT `'ORD-'` (Derived from `Campus.GRPrefix`)
- `voucherPrefix`: `VARCHAR(10)` DEFAULT `'VCH-'`
- `bankName`: `VARCHAR(100)` NULL (Printed on branch challans/vouchers)
- `bankAccountTitle`: `VARCHAR(150)` NULL
- `bankAccountNumber`: `VARCHAR(100)` NULL
- `bankIBAN`: `VARCHAR(50)` NULL
- `bankBranchDetail`: `VARCHAR(150)` NULL
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`

#### 2.3 `core.operating_shifts` (Derived from `[dbo].[SchoolShift]`)
- `id`: `UUID` PK
- `businessId`: `UUID` FK -> `core.businesses(id)`
- `branchId`: `UUID` FK -> `core.branches(id)`
- `shiftName`: `VARCHAR(100)` NOT NULL (e.g., `'Morning Delivery Shift'`, `'Afternoon Shift'`, `'Night Bottling Shift'`)
- `shiftCode`: `VARCHAR(20)` NULL
- `startTime`: `TIME(0)` NOT NULL (e.g. `08:00:00`)
- `endTime`: `TIME(0)` NOT NULL (e.g. `14:00:00`)
- `shiftInchargeId`: `UUID` NULL FK -> `security.users(id)` (Dispatcher/Supervisor in charge)
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`

#### 2.4 `config` Master Tables (Derived from `[Config].*`)
- **`config.time_zones`**: `id`, `name`, `description`, `timeZoneCode` (`'Pakistan Standard Time'`, `'UTC'`), `displayOffset` (`'GMT+05:00'`), `isActive`.
- **`config.countries` / `config.states` / `config.cities`**: Standardized geographic master data.
- **`config.delivery_zones`**: `id`, `businessId`, `branchId`, `cityId`, `zoneName` (e.g. `'DHA Phase 6'`, `'Gulshan Block 13D'`), `zoneCode`, `deliveryFeeOverride`, `boundaryPolygon` (JSONB), `isActive`.

---

### 👷 Schema 3: `hr` (Employee Master, Driver Onboarding, Attendance & Leave)

#### 3.1 `hr.employees` (Derived from `[Config].[Employee]`)
- `id`: `UUID` PK
- `businessId`: `UUID` FK -> `core.businesses(id)`
- `branchId`: `UUID` FK -> `core.branches(id)`
- `employeeCode`: `VARCHAR(20)` NOT NULL (`UNIQUE(businessId, employeeCode)`)
- `loginUserId`: `UUID` NULL FK -> `security.users(id)` (Links HR record to app login if applicable)
- `managerId`: `UUID` NULL FK -> `security.users(id)`
- `firstName`: `VARCHAR(150)` NOT NULL
- `middleName`: `VARCHAR(150)` NULL
- `lastName`: `VARCHAR(150)` NOT NULL
- `phoneNumber`: `VARCHAR(20)` NOT NULL
- `email`: `VARCHAR(100)` NULL
- `cnic`: `VARCHAR(20)` NOT NULL
- `cnicIssueDate`: `DATE` NULL
- `cnicExpiryDate`: `DATE` NULL
- `drivingLicenseNo`: `VARCHAR(50)` NULL (For delivery drivers)
- `drivingLicenseExpiry`: `DATE` NULL
- `designationId`: `INT` FK -> `config.designations(id)` (`Driver`, `Route Helper`, `Plant Operator`, `Quality Chemist`, `Dispatcher`, `Accountant`)
- `employmentTypeId`: `INT` FK -> `config.employment_types(id)` (`Permanent`, `Contract`, `Daily Wage`, `Commission Only`)
- `hireDate`: `DATE` NOT NULL
- `resignDate`: `DATE` NULL
- `termReason`: `VARCHAR(500)` NULL
- `dateOfBirth`: `DATE` NULL
- `address`: `VARCHAR(250)` NULL
- `cityId`: `INT` NULL
- `bankName`: `VARCHAR(100)` NULL
- `bankAccountNo`: `VARCHAR(50)` NULL
- `eobiNo`: `VARCHAR(30)` NULL
- `grossPay`: `DECIMAL(12,2)` NOT NULL DEFAULT `0.00`
- `otherAllowances`: `DECIMAL(12,2)` NOT NULL DEFAULT `0.00`
- `perBottleCommission`: `DECIMAL(10,2)` NOT NULL DEFAULT `0.00` (ERP driver commission per 19L bottle delivered!)
- `status`: `VARCHAR(20)` DEFAULT `'ACTIVE'`
- `active`: `BOOLEAN` NOT NULL DEFAULT `true`
- `createdBy`, `createdOn`, `modifiedBy`, `modifiedOn`

#### 3.2 `hr.employee_attendances` & `hr.leave_requests` (Derived from `Attendance.sql` & `LeaveRequest.sql`)
- **`hr.employee_attendances`**: `id`, `businessId`, `branchId`, `shiftId`, `employeeId`, `attendanceDate`, `checkInTime`, `checkOutTime`, `checkInLat`, `checkInLng`, `status` (`PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`), `remarks`, `createdBy`, `createdOn`.
- **`hr.leave_requests`**: `id`, `businessId`, `employeeId`, `leaveTypeId`, `fromDate`, `toDate`, `reason`, `status` (`Pending`, `Approved`, `Rejected`), `approvedBy`, `approverRemarks`, `approvedOn`, `appliedByUserId`, `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`.

---

### 👥 Schema 4: `crm` (Customers, Onboarding Stages, Addresses & Bottle Balances)

#### 4.1 `crm.customers` (Enhanced with `Student.sql` & `Candidate.sql` ERP attributes)
- `id`: `UUID` PK
- `businessId`: `UUID` FK -> `core.businesses(id)`
- `branchId`: `UUID` FK -> `core.branches(id)`
- `shiftId`: `UUID` NULL FK -> `core.operating_shifts(id)` (Default delivery shift: Morning vs Evening)
- `customerCode`: `VARCHAR(30)` NOT NULL (Derived from `GRNo` in `Student.sql`, e.g., `CUST-DHA-00104`, `UNIQUE(businessId, customerCode)`)
- `userId`: `UUID` NULL FK -> `security.users(id)`
- `customerType`: `VARCHAR(30)` (`RESIDENTIAL`, `CORPORATE`, `COMMERCIAL`, `INSTITUTIONAL`, `DEALER_WHOLESALE`)
- `companyName`: `VARCHAR(250)` NULL
- `ntnNumber`: `VARCHAR(50)` NULL (Tax number for corporate water invoicing)
- `contactPersonName`: `VARCHAR(150)` NOT NULL
- `cellPhone`: `VARCHAR(20)` NOT NULL
- `whatsAppPhone`: `VARCHAR(20)` NULL
- `email`: `VARCHAR(150)` NULL
- `cnicOrBForm`: `VARCHAR(30)` NULL (For security deposit verification)
- `joinDate`: `DATE` NOT NULL DEFAULT `CURRENT_DATE`
- `exitDate`: `DATE` NULL
- `exitReason`: `VARCHAR(250)` NULL
- `billingCycle`: `VARCHAR(20)` DEFAULT `'PER_ORDER'` (`PER_ORDER_COD`, `PREPAID_WALLET`, `MONTHLY_VOUCHER`)
- `discountPackageId`: `UUID` NULL FK -> `billing.discount_packages(id)` (Derived from `Student.FeeDiscountPackageId`!)
- `creditLimit`: `DECIMAL(18,2)` NOT NULL DEFAULT `5000.00`
- **Cached Ledger Balances (Strictly synchronized with `BottleLedgerEntry` & `BillingVoucher`)**:
  - `bottleBalance19L`: `INT` NOT NULL DEFAULT `0`
  - `bottleBalance12L`: `INT` NOT NULL DEFAULT `0`
  - `heldDepositBalance`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
  - `outstandingArrears`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00` (Unpaid balance)
  - `prepaidWalletBalance`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `enrollmentStatusId`: `SMALLINT` DEFAULT `1` (`1=Active, 2=Paused, 3=Suspended_Overdue, 4=Closed_Deposit_Settled`)
- `remarks`: `TEXT` NULL
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`

#### 4.2 `crm.customer_addresses`
- `id`, `businessId`, `customerId`, `deliveryZoneId` (FK -> `config.delivery_zones`), `label`, `street`, `building`, `floor`, `apartmentOrOfficeNo`, `hasElevator` (`BOOLEAN` — crucial for 19L bottle floor delivery charges!), `latitude`, `longitude`, `deliveryInstructions`, `preferredShiftId`, `routeStopSequence` (`INT` — default stop order on driver's route), `isDefault`, `isDeleted`.

#### 4.3 `crm.customer_onboarding_history` (Derived from `CandidateOnboardingHistory.sql` & `OnboardingStages.sql`)
- Tracks corporate/residential customer onboarding & termination stages:
  - `1=Lead_Inquiry` -> `2=Site_Address_Verification` -> `3=Security_Deposit_Collected` -> `4=Starter_Bottles_Issued` -> `5=Active_Subscriber` -> `6=Closure_Requested` -> `7=Empty_Bottles_Recovered` -> `8=Deposit_Refunded`.
- Attributes: `id`, `businessId`, `customerId`, `stageId`, `stageName`, `stageCompletionDate`, `statusId`, `statusName`, `actionDetails`, `createdBy`, `createdOn`, `isDeleted`.

---

### 📦 Schema 5: `catalog` & `inventory` (Products, Plant Production, Stock & Bottle Ledger)

#### 5.1 `catalog.categories` & `catalog.products`
- `id`, `businessId`, `categoryId`, `sku`, `name`, `sizeLiters` (`19.00`, `12.00`, `6.00`, `1.50`, `0.50`), `isReturnableBottle` (`BOOLEAN`), `sellingPrice`, `depositPrice`, `costPrice`, `lateReturnPenaltyPerMonth`, `damagedPenaltyPrice`, `taxPercentage`, `isActive`, `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`.

#### 5.2 `inventory.branch_inventories` & `inventory.stock_transactions`
- Tracks per-branch, per-product quantities:
  - `fullQuantity` (Filled, sealed & QC-passed bottles ready for dispatch)
  - `emptyCleanQuantity` (Washed empty bottles ready for filling)
  - `emptyDirtyQuantity` (Returned from market, awaiting washing/sanitization)
  - `damagedQuantity` (Cracked/leaking bottles awaiting scrap)
  - `inMarketCustomerQuantity` (Total bottles currently held by customers of this branch)
  - `onVehicleTransitQuantity` (Bottles currently loaded on delivery trucks out on routes)

#### 5.3 `inventory.bottle_ledger_entries` (Immutable Double-Entry Bottle Asset Ledger)
- `id`: `UUID` PK
- `businessId`, `branchId`, `shiftId`, `customerId`, `orderId`, `deliveryId`, `productId`
- `transactionType`: `DELIVERY_ISSUANCE`, `DELIVERY_RETURN`, `DAMAGED_RETURN`, `LOST_BOTTLE_PENALTY`, `DEPOSIT_COLLECTED`, `DEPOSIT_REFUNDED`, `AUDIT_ADJUSTMENT`
- `fullDelivered`: `INT` NOT NULL DEFAULT `0`
- `emptyReturned`: `INT` NOT NULL DEFAULT `0`
- `damagedCount`: `INT` NOT NULL DEFAULT `0`
- `lostCount`: `INT` NOT NULL DEFAULT `0`
- `depositAdded`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `depositRefunded`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `runningBottleBalance`: `INT` NOT NULL
- `runningDepositBalance`: `DECIMAL(18,2)` NOT NULL
- `source`: `VARCHAR(50)` (`'DriverMobileApp'`, `'AdminDesk'`, `'POSWalkIn'`, `'AuditCorrection'`)
- `changeReason`: `VARCHAR(250)` NULL
- `performedById`: `UUID` NOT NULL
- `createdOn`: `TIMESTAMPTZ(3)` NOT NULL DEFAULT `NOW()`

---

### 🚚 Schema 6: `logistics` (Orders, Gate Passes, Deliveries & Bitmask Recurring Subscriptions)

#### 6.1 `logistics.subscription_recurrence_rules` (Directly modeled after `EventRecurrenceRule.sql`)
- `id`: `UUID` PK
- `businessId`: `UUID` FK -> `core.businesses(id)`
- `customerId`: `UUID` FK -> `crm.customers(id)`
- `addressId`: `UUID` FK -> `crm.customer_addresses(id)`
- `shiftId`: `UUID` FK -> `core.operating_shifts(id)`
- `recurrenceType`: `SMALLINT` NOT NULL (`1=Daily, 2=Weekly, 3=Monthly, 4=AlternateDays`)
- `interval`: `INT` NOT NULL DEFAULT `1`
- `daysOfWeekMask`: `SMALLINT` NULL (**Bitmask**: `Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64` — e.g. Mon+Thu = `1+8 = 9`)
- `dayOfMonth`: `SMALLINT` NULL
- `weekOfMonth`: `SMALLINT` NULL
- `rangeStartDate`: `DATE` NOT NULL
- `rangeEndDate`: `DATE` NULL
- `occurrenceLimit`: `INT` NULL
- `status`: `VARCHAR(20)` DEFAULT `'ACTIVE'` (`ACTIVE`, `PAUSED`, `CANCELLED`)
- `pausedFromDate`: `DATE` NULL
- `pausedToDate`: `DATE` NULL
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`

#### 6.2 `logistics.subscription_occurrences` (Directly modeled after `EventOccurrence.sql`)
- `id`: `UUID` PK
- `businessId`: `UUID` NOT NULL
- `subscriptionRuleId`: `UUID` FK -> `logistics.subscription_recurrence_rules(id)`
- `occurrenceDate`: `DATE` NOT NULL
- `shiftId`: `UUID` NOT NULL
- `statusId`: `SMALLINT` NOT NULL (`1=Scheduled, 2=OrderGenerated, 3=SkippedByCustomer, 4=HolidaySkipped, 5=Delivered, 6=Failed`)
- `isException`: `BOOLEAN` NOT NULL DEFAULT `false` (True if customer modified quantity, date, or address for this single date)
- `addressIdOverride`: `UUID` NULL FK -> `crm.customer_addresses(id)`
- `quantityOverride`: `INT` NULL
- `generatedOrderId`: `UUID` NULL FK -> `logistics.orders(id)`
- `notes`: `VARCHAR(500)` NULL
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`
- **Constraint**: `UNIQUE (subscriptionRuleId, occurrenceDate)` (100% immune to duplicate BullMQ order generation!)

#### 6.3 `logistics.vehicle_gate_passes` (Inspired by `Settings.Module: Gate Pass` in `sch`)
In a real water bottling ERP, a delivery truck cannot leave the plant gate without a **Vehicle Load Sheet / Gate Pass**:
- `id`: `UUID` PK
- `businessId`, `branchId`, `shiftId`, `driverId`, `vehicleNumber`, `dispatchDate`
- `gatePassNumber`: `VARCHAR(50)` UNIQUE
- `fullBottlesLoaded19L`: `INT` NOT NULL
- `fullBottlesLoaded12L`: `INT` NOT NULL
- `unsoldFullReturned19L`: `INT` DEFAULT `0`
- `emptyBottlesCollected19L`: `INT` DEFAULT `0`
- `damagedBottlesReturned19L`: `INT` DEFAULT `0`
- `expectedCashAmount`: `DECIMAL(18,2)` DEFAULT `0.00`
- `actualCashHandedOver`: `DECIMAL(18,2)` DEFAULT `0.00`
- `cashVariance`: `DECIMAL(18,2)` DEFAULT `0.00`
- `bottleVariance`: `INT` DEFAULT `0`
- `gateOutTime`: `TIMESTAMPTZ` NULL
- `gateInTime`: `TIMESTAMPTZ` NULL
- `verifiedBySecurityId`: `UUID` NULL
- `reconciledByAccountantId`: `UUID` NULL
- `status`: `VARCHAR(30)` (`LOADED`, `DISPATCHED_OUT`, `RETURNED_TO_PLANT`, `RECONCILED_CLOSED`)

#### 6.4 `logistics.orders` & `logistics.order_items` & `logistics.deliveries`
- Links `Order` -> `Delivery` -> `VehicleGatePass` with OTP verification (`otpCode`, `otpVerified`), proof photo (`proofPhotoUrl`), GPS drop coordinates (`deliveredLat`, `deliveredLng`), `cashCollected`, and `emptyBottlesCollected`.

---

### 💰 Schema 7: `billing` (Vouchers/Challans, Discount Packages, Arrears & Expenses — Derived from `FeeVoucher*`)

#### 7.1 `billing.charge_types` & `billing.customer_rate_cards` (Derived from `FeeType.sql` & `FeeSetup.sql`)
- **`billing.charge_types`**: `id`, `businessId`, `code` (`WATER_REFILL_19L`, `BOTTLE_DEPOSIT_19L`, `DISPENSER_RENT`, `DELIVERY_CHARGES`, `FLOOR_CARRY_FEE`, `LATE_PAYMENT_FINE`, `LOST_BOTTLE_CHARGE`), `name`, `isRefundableDeposit` (`BOOLEAN`), `glAccountCode` (Chart of Accounts code), `isActive`.
- **`billing.customer_rate_cards`**: Custom negotiated per-bottle prices for specific corporate customers!

#### 7.2 `billing.discount_packages` & `billing.discount_package_details` (Derived from `FeeDiscountPackages.sql` & `FeeDiscountPackageDetail.sql`)
- **`billing.discount_packages`**: `id`, `businessId`, `branchId`, `packageName`, `displayName`, `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted` (`UNIQUE(branchId, packageName) WHERE isDeleted = false`).
- **`billing.discount_package_details`**: `id`, `discountPackageId`, `chargeTypeId` / `productId`, `discountType` (`PERCENTAGE`, `FIXED_AMOUNT`), `discountValue` (`DECIMAL(18,2)`), `createdBy`, `createdOn`, `isDeleted`.

#### 7.3 `billing.voucher_processing_runs` (Derived from `FeeVoucherProcessing.sql`)
- Tracks batch monthly invoice generation across branches/shifts/zones:
- `id`, `businessId`, `branchId`, `shiftId`, `deliveryZoneIds` (`VARCHAR(500)`), `customerIds` (`TEXT`), `excludedCustomerIds` (`TEXT`), `billingMonth` (`DATE`), `issueDate` (`DATE`), `dueDate` (`DATE`), `validityDate` (`DATE`), `statusId` (`1=Queued, 2=Processing, 3=Completed, 4=Failed`), `totalVouchersGenerated`, `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`.

#### 7.4 `billing.billing_vouchers` (Directly modeled after `FeeVoucher.sql`)
- `id`: `UUID` PK
- `businessId`: `UUID` NOT NULL
- `branchId`: `UUID` NOT NULL
- `processingRunId`: `UUID` NULL FK -> `billing.voucher_processing_runs(id)`
- `customerId`: `UUID` NOT NULL FK -> `crm.customers(id)`
- `voucherNo`: `VARCHAR(100)` NOT NULL (`UNIQUE(businessId, voucherNo)`)
- `issueDate`: `TIMESTAMPTZ` NOT NULL
- `dueDate`: `TIMESTAMPTZ` NOT NULL
- `validityDate`: `TIMESTAMPTZ` NULL
- `billingMonth`: `DATE` NOT NULL (e.g. `2026-11-01`)
- `challanType`: `VARCHAR(50)` (`'MonthlyPostpaid'`, `'SingleOrderInvoice'`, `'SecurityDepositChallan'`)
- `grossAmount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `totalDiscount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `totalAdditionalDiscount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `lateFee`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `previousArrears`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `depositLiabilityAmount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00` (Segregated bottle security deposit!)
- `payableAmount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `paidAmount`: `DECIMAL(18,2)` NOT NULL DEFAULT `0.00`
- `paidDate`: `TIMESTAMPTZ` NULL
- `paymentStatus`: `VARCHAR(50)` NOT NULL DEFAULT `'Unpaid'` (`Unpaid`, `PartiallyPaid`, `Paid`, `Overdue`, `Voided`)
- `paymentMethod`: `VARCHAR(50)` NULL
- `receiptNo`: `VARCHAR(100)` NULL
- `remarks`: `VARCHAR(500)` NULL
- `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`, `isDeleted`
- **Constraint**: `UNIQUE (customerId, billingMonth, challanType) WHERE isDeleted = false`

#### 7.5 `billing.billing_voucher_details` & `billing.billing_voucher_payments` (Derived from `FeeVoucherDetail.sql` & `FeeVoucherPayment.sql`)
- **`billing.billing_voucher_details`**: `id`, `billingVoucherId`, `chargeTypeId`, `orderId` (Nullable link to specific order), `quantity`, `unitRate`, `amount` (`DECIMAL(18,2)`), `discountedAmount`, `additionalDiscount`, `revisedAmount`, `discountPackageDetailId`, `remarks`, `createdBy`, `createdOn`, `isDeleted`.
- **`billing.billing_voucher_payments`**: `id`, `businessId`, `billingVoucherId`, `paymentAmount` (`DECIMAL(18,2)`), `paymentDate`, `receivedByUserId` (Driver or Cashier ID), `reconciledByUserId` (Accountant ID), `reconciledOn`, `paymentMode` (`Cash`, `BankTransfer`, `Easypaisa`, `JazzCash`, `Cheque`), `transactionReference`, `remarks`, `createdOn`, `createdBy`, `isDeleted`.

---

### 🔔 Schema 8: `notify` (Multi-Channel Notification Outbox & Idempotent Scheduler — Directly from `[Notify].*`)

#### 8.1 `notify.notification_types` & `notify.notification_channels`
- Channels: `1=SMS, 2=WhatsApp, 3=Email, 4=InApp_Push`.
- Types: `ORDER_CONFIRMED`, `DRIVER_OUT_FOR_DELIVERY`, `DELIVERY_OTP_CODE`, `DELIVERY_COMPLETED_SUMMARY`, `MONTHLY_VOUCHER_ISSUED`, `VOUCHER_DUE_REMINDER`, `UNRETURNED_BOTTLE_REMINDER`, `LOW_PLANT_STOCK_ALERT`.

#### 8.2 `notify.notification_tenant_settings` (Directly from `Notify.NotificationTenantSetting.sql`)
- `businessId` (PK), `isEnabled`, `isSmsEnabled`, `isWhatsAppEnabled`, `isEmailEnabled`, `isInAppEnabled`, `defaultLanguageCode` (`'en'`, `'ur'`), `timeZoneId`, `quietHoursStart` (`TIME(0)`), `quietHoursEnd` (`TIME(0)`), `smsProviderCode`, `smsSenderId`, `smsProviderConfig`, `dailySmsLimit`, `whatsAppProviderCode`, `whatsAppBusinessAccountId`, `whatsAppPhoneNumberId`, `whatsAppProviderConfig`, `emailProviderCode`, `emailFromAddress`, `emailFromName`, `emailProviderConfig`, `modifiedBy`, `modifiedOn`.

#### 8.3 `notify.notification_settings` & `notify.notification_templates`
- **`notify.notification_settings`**: Composite PK `(businessId, notificationTypeId)`, `isSmsEnabled`, `isWhatsAppEnabled`, `isEmailEnabled`, `isInAppEnabled`, `modifiedBy`, `modifiedOn`.
- **`notify.notification_templates`**: `id`, `businessId` (NULL for global default template, UUID for tenant override!), `notificationTypeId`, `notificationChannelId`, `languageCode` (`'en'`, `'ur'`), `subject`, `body`, `actionUrl`, `isHtml`, `version`, `isActive`, `createdBy`, `createdOn`, `modifiedBy`, `modifiedOn`.

#### 8.4 `notify.notification_deliveries` (Directly from `Notify.NotificationDelivery.sql`)
- `notificationDeliveryId` (`BIGINT` PK), `notificationId`, `notificationChannelId`, `businessId`, `userId`, `recipientAddress`, `languageCode`, `notificationTemplateId`, `renderedSubject`, `renderedBody`, `actionUrl`, `status` (`0=Queued, 1=Sending, 2=Sent, 3=Delivered, 4=Read, 5=RetryScheduled, 6=Failed, 7=SuppressedQuietHours`), `statusReason`, `attemptCount`, `nextRetryOn`, `lastAttemptOn`, `providerCode`, `providerMessageId`, `errorCode`, `errorMessage`, `queuedOn`, `sentOn`, `deliveredOn`, `readOn`.

#### 8.5 `notify.schedule_rules` & `notify.schedule_runs` (Directly from `Notify.ScheduleRule.sql` & `Notify.ScheduleRun.sql`)
- **`notify.schedule_rules`**: `id`, `businessId`, `notificationTypeId`, `isEnabled`, `frequency` (`1=Every5Min, 2=Hourly, 3=Daily, 4=Weekly, 5=Monthly`), `runAtTime` (`TIME(0)`), `runOnDayOfWeek` (`0..6`), `runOnDayOfMonth` (`1..31`), `offsetValue` (e.g. `3` days before voucher due date), `thresholdValue` (e.g. `5` unreturned empty bottles).
- **`notify.schedule_runs`**: `id`, `scheduleRuleId`, `businessId`, `windowKey` (`VARCHAR(30)` e.g. `'20261112'`), `status` (`1=Running, 2=Completed, 3=Failed`), `startedOn`, `finishedOn`, `candidateCount`, `sentCount`, `failedCount`, `errorMessage`.
  - **Idempotency Constraint**: `UNIQUE (scheduleRuleId, businessId, windowKey)`.

---

### 📊 Schema 9: `audit` & `log` (Snapshots, Field Diffs, History & Mobile Telemetry — Directly from `[Log].*` & `Audit` tables)

#### 9.1 `audit.bottle_ledger_audits` (Modeled after `ResultDetailAudit.sql`)
- Captures any manual adjustment or correction to a delivery or customer bottle count:
- `id` (`BIGINT` PK), `bottleLedgerEntryId`, `customerId`, `orderId`, `oldFullDelivered`, `newFullDelivered`, `oldEmptyReturned`, `newEmptyReturned`, `oldDamagedCount`, `newDamagedCount`, `oldDepositAmount`, `newDepositAmount`, `changeReason` (`VARCHAR(250)` NOT NULL), `source` (`VARCHAR(50)`), `changedBy` (`UUID` NOT NULL), `changedOn` (`TIMESTAMPTZ`).

#### 9.2 `audit.plant_daily_snapshots` (Modeled after `ResultSnapshot.sql` & `ResultSnapshotItem.sql`)
- Freezes daily depot stock and bottle market exposure at shift/day close:
- `id`, `businessId`, `branchId`, `snapshotDate`, `versionNumber`, `snapshotType` (`'ShiftClose'`, `'DailyEndClose'`, `'PreAuditFreeze'`, `'MonthlyClose'`), `totalFullBottlesInPlant`, `totalEmptyBottlesInPlant`, `totalDamagedBottles`, `totalBottlesInCustomerMarket`, `totalDepositLiabilityHeld`, `totalCashCollectedToday`, `totalUnpaidArrears`, `notes`, `createdBy`, `createdOn`, `isDeleted`.

#### 9.3 `audit.customer_histories` (Modeled after `Student_History.sql`)
- Shadow history table recording `'I'`, `'U'`, `'D'` actions on `crm.customers` with `historyId`, `actionDate`, `action`, `actorUserId`, `ipAddress`, and full row snapshot.

#### 9.4 `log.mobile_log_batches` & `log.mobile_log_entries` & `log.error_logs` (Directly from `[Log].[MobileLogBatch]`, `[Log].[MobileLogEntry]`, `dbo.ErrorLog`)
- **`log.mobile_log_batches`**: `id`, `businessId`, `platform` (`'Android'`, `'iOS'`, `'PWA'`), `osVersion`, `modelName`, `appVersion`, `buildNumber`, `isLoggedIn`, `userName`, `driverUserId`, `uploadedOn`.
- **`log.mobile_log_entries`**: `id` (`BIGINT`), `batchId`, `timestamp` (`TIMESTAMPTZ(3)`), `level` (`'INFO'`, `'WARN'`, `'ERROR'`, `'FATAL'`), `screen` (`'RouteExecutionScreen'`, `'OTPVerifyModal'`), `action` (`'COMPLETE_DELIVERY_OFFLINE_SYNC'`), `message`, `payload` (JSONB).
- **`log.error_logs`**: `id` (`BIGINT`), `businessId`, `errorMessage`, `errorType` (`'Database'`, `'Validation'`, `'BullMQWorker'`, `'PaymentGateway'`), `errorSource` (API route or service method), `stackTrace`, `userId`, `inputPayload`, `severity` (`'Critical'`, `'Error'`, `'Warning'`), `createdOn`.


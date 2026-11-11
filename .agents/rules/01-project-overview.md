# Rule 01: Project Overview & Domain Scope

## 🌐 1. Platform Purpose & Mission

**AquaFlow** is an enterprise-grade multi-tenant Software-as-a-Service (SaaS) platform tailored specifically for the drinking water production, purification, and distribution industry.

Drinking water suppliers face unique logistical and financial operational challenges:
1. **Physical Returnable Asset Tracking**: 19L and 12L polycarbonate bottles are expensive capital assets. Tracking empty bottles returned vs. full bottles delivered is critical to prevent stock shrinkage.
2. **Deposit Accounting**: Customers hold bottle deposits that must be separated from operational product revenue.
3. **Recurring Delivery Logistics**: Customers (homes, offices, schools, hospitals) require automated subscriptions (daily, weekly, alternate days).
4. **Driver Dispatch & Field Reconciliation**: Delivery drivers navigate daily routes, collect cash-on-delivery, verify deliveries via OTP, and hand over cash and empty bottles at the end of each shift.

---

## 👥 2. User Roles & Permission Matrix

AquaFlow serves six distinct actor personas across four user-facing interfaces:

| Persona | Primary Interface | Scope & Privileges |
| :--- | :--- | :--- |
| **Super Admin** | Super Admin Panel (`/admin`) | Platform owner. Views all businesses, configures SaaS plans, approves/suspends businesses, views platform MRR and tenant growth. |
| **Business Owner** | Business Admin Panel (`/business`) | Water enterprise owner. Full control of tenant settings, branches, staff invitations, product catalog, pricing, customers, orders, inventory, and financial statements. |
| **Manager** | Business Admin Panel (`/business`) | Operations supervisor. Manages daily dispatch, inventory intake, assigns drivers, approves orders, handles customer disputes. |
| **Accountant** | Business Admin Panel (`/business`) | Financial officer. Reconciles driver cash collections, records business expenses, generates tax invoices, views profit & loss statements. |
| **Delivery Staff** | Delivery Staff Panel (`/delivery`) | Field driver. Mobile-optimized touch interface. Views daily delivery stops, customer phone/address/GPS, marks deliveries, captures OTP, collects cash, and records empty bottles returned. |
| **Customer** | Customer Portal (`/portal`) | End consumer. Browses bottle sizes (19L, 12L, 6L), places one-time orders, sets up recurring subscriptions, tracks outstanding bottles, and views invoices. |

---

## 🏢 3. Multi-Tenant Model

AquaFlow adopts a **Shared Database, Shared Schema Multi-Tenancy Architecture** with strict logical isolation and PostgreSQL Row Level Security (RLS):

- Every business is a tenant (`Business` entity).
- All operational entities (`Customer`, `Product`, `Order`, `Delivery`, `Inventory`, `BottleLedgerEntry`, `Payment`, `Expense`) carry a foreign key `businessId`.
- Super Admins operate cross-tenant for platform health, billing, and dispute management.
- Business Users and Delivery Staff operate strictly within their authenticated `businessId`.
- Customers can have memberships across multiple water suppliers if they wish, with distinct customer profiles per business.


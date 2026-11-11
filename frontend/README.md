# AquaFlow Frontend — Interfaces & UI Architecture

This directory houses the web applications and user interfaces for **AquaFlow SaaS**, built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

---

## 🖥️ The 4 Major Interfaces & Portals

### 1. Super Admin Panel (`/admin`)
- **Audience:** SaaS Platform Owner
- **Core Domain Capabilities:**
  - View all registered water businesses & operational health
  - Approve, activate, or suspend tenant accounts
  - Configure SaaS subscription plans (Free Trial, Starter, Pro, Enterprise)
  - Platform analytics: Monthly Recurring Revenue (MRR), total customer bottles in market, subscriber growth
  - Platform audit logs & system activity monitor

### 2. Business Admin Panel (`/business`)
- **Audience:** Water Plant Owners, Operations Managers, Accountants
- **Core Domain Capabilities:**
  - **Business Configuration:** Company profile, logo, delivery areas, working hours, bottle deposit rates, delivery charges
  - **Branch / Depot Management:** Multiple filling plants and distribution hubs
  - **Employee & RBAC:** Invite staff with role permissions (Manager, Accountant, Driver)
  - **Customer Management:** Customer directory, multiple delivery addresses with GPS tags, bottle balance, deposit balance, credit ledger
  - **Product Catalog:** 19L, 12L, 6L water bottles, dispensers, pumps, accessories, pricing
  - **Order Operations:** Real-time order queue (Pending, Confirmed, Processing, Assigned, Out for Delivery, Delivered)
  - **Bottle Ledger:** Full delivered vs. empty returned tracking, deposit liability escrow
  - **Inventory:** Stock levels per branch (Full, Empty, Damaged), inter-branch stock transfers
  - **Delivery Dispatch:** Assign orders to drivers, view daily delivery schedules
  - **Accounting & P&L:** Cash-on-delivery reconciliation, business expenses, revenue reports, invoices

### 3. Delivery Staff Panel (`/delivery`)
- **Audience:** Field Drivers & Delivery Technicians (Mobile-first Touch UI)
- **Core Domain Capabilities:**
  - View assigned daily delivery stops and delivery sequence
  - Customer details: Contact phone (one-tap call), delivery address, GPS directions, delivery instructions
  - Mark order as "Out for Delivery"
  - Complete delivery:
    - Verify customer OTP (or driver override)
    - Record full bottles handed over
    - Record empty bottles collected
    - Record damaged bottles returned
    - Record cash collected on delivery
  - Mark delivery as failed with standardized failure reasons (Gate locked, Customer unavailable, etc.)

### 4. Customer Portal (`/portal`)
- **Audience:** Residential and Commercial Water Consumers
- **Core Domain Capabilities:**
  - Self-service registration & login
  - Browse bottle sizes and accessories
  - Place one-time orders with delivery date and time slot selection
  - Set up recurring delivery subscriptions (Daily, Alternate Days, Weekly, Custom days)
  - Manage multiple delivery addresses
  - View bottle balance (how many empty bottles currently held) and deposit balance
  - View order history, payment history, and invoices


# Module 14: Dashboards, Executive Analytics & KPI Reporting

## 🎯 Domain Scope & Objectives
Provide interactive, data-driven analytical dashboards for Super Admins and Business Owners with Recharts visual graphs, date range filters, and actual SQL aggregations.

---

## 📊 Analytics Metrics Breakdown

### A. Super Admin Dashboard Metrics (`/api/v1/admin/analytics`)
- **Total Registered Businesses** & Active vs. Suspended count
- **Monthly Recurring Revenue (MRR)** from SaaS plan subscriptions
- **Platform Subscription Growth Rate** (MoM % growth)
- **Total Platform Customers & Orders processed**
- **Activity Feed**: Real-time signups, plan upgrades, and tenant status changes

### B. Business Admin Dashboard Metrics (`/api/v1/analytics/overview`)
- **Today's Operational Metrics**:
  - Today's Orders & Deliveries Completed
  - Today's Sales Revenue (Excluding Deposits)
  - Today's Cash Collected vs. Bank Payments
  - Total Full Bottles Dispatched vs. Empty Bottles Returned Today
- **Financial Performance (Recharts Monthly Area/Bar Chart)**:
  - 30-day Revenue, Cost of Goods Sold (COGS), Expenses, and Net Margin
- **Empty Bottle Market Exposure**:
  - Total 19L Bottles in Circulation (at customer locations)
  - Total Deposit Liabilities Held in Escrow
- **Driver Performance Leaderboard**:
  - Deliveries completed per driver, on-time percentage, cash collected
- **Inventory Summary**:
  - Full vs. Empty vs. Damaged bottle stock across all business branches


# Rule 05: Automated Feature Tracking & Context Sync Protocol

## 🎯 Purpose
To guarantee that the codebase, agent memory, domain specifications, and feature roadmaps remain 100% synchronized across iterative development sessions.

---

## ⚡ Mandatory 3-Step Protocol for AI Assistants

Whenever completing any of the following:
1. Implementing a new domain module or endpoint
2. Updating Prisma models or generating database migrations
3. Adding or updating DI container wiring in `src/core/container.ts`
4. Building or updating frontend feature layouts or pages
5. Fixing critical bugs or resolving performance bottlenecks

**You MUST execute this 3-step sync protocol before concluding your turn:**

---

### Step 1: Update `.agents/context/FEATURE_LOG.md`
Append a new entry containing:
- **Timestamp / Date**
- **Module / Feature Name** (e.g., `Bottle Ledger & Deposits`, `Order Lifecycle`)
- **Action Type**: `[NEW FEATURE]`, `[MIGRATION]`, `[BUG FIX]`, `[ARCHITECTURE]`
- **Summary of Changes**: Exact architectural and code modifications made.
- **Affected Files**: Repositories, Services, Controllers, Routes, Validators, Prisma models, React components.
- **Endpoints Modified or Added**: HTTP Method + Path (e.g. `POST /api/v1/bottle-ledger/entries`).

---

### Step 2: Update `feature.md` & `PROJECT_CONTEXT.md`
- Mark completed tasks with `[x]` in `feature.md`.
- Keep the Models Dictionary and Endpoint Catalog in `PROJECT_CONTEXT.md` up to date.
- Update domain specifications in `.agents/context/modules/` if invariants were adjusted.

---

### Step 3: Closed-Loop Verification Gate
- Run `npx tsc --noEmit` in both backend and frontend to verify 0 compile-time errors.
- Run tests relevant to the changed modules.


---
name: systematic-debug
description: "Structured root-cause debugging protocol for resolving complex issues in AquaFlow across PostgreSQL transactions, Prisma connection limits, BullMQ queues, Socket.IO real-time channels, and React frontend state."
metadata:
  author: aquaflow-architect
  version: "1.0.0"
---

# Systematic Debugging Playbook (AquaFlow)

Use this skill whenever troubleshooting backend errors, transaction timeouts, queue delivery failures, or UI state inconsistencies.

---

## 🛠️ Step-by-Step Diagnostic Routine

### 1. Identify Layer & Failure Signature
- **Prisma Error Codes**:
  - `P2002`: Unique constraint violation. Check duplicate fields (e.g. SKU, email, active phone number).
  - `P2003`: Foreign key constraint failed. An ID passed in does not exist or was deleted.
  - `P2025`: An operation failed because it depends on one or more records that were required but not found.
  - `P2028`: Transaction timeout. Check long-running queries or deadlocks inside `$transaction`.
- **Zod Validation Rejection (400)**:
  - Inspect `error.details` to see which field failed validation rules.
- **BullMQ Job Stalls**:
  - Check if Redis connection is active and if job worker handlers are catching exceptions.
- **Socket.IO Room Issues**:
  - Verify if client emitted `join-tenant` with authenticated handshake data.

### 2. Verify with Direct Reproduction
- Formulate a curl request, integration test, or direct script in `tests/` reproducing the exact failure.
- Never guess the fix — verify with a test before and after applying changes.


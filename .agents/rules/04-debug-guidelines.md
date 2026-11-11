# Rule 04: Systematic Debugging Protocol

## 🔍 The 5-Whys Debugging Protocol for AquaFlow

When an error, test failure, or unexpected behavior occurs:

### Phase 1: Observation & Reproduction
1. Capture the exact error message, stack trace, and HTTP request payload.
2. Determine which layer failed:
   - **Route / Middleware**: Auth token expired, invalid tenant header, Zod schema rejection (400).
   - **Controller**: Unhandled parameter extraction, incorrect status code.
   - **Service**: Domain invariant violation, missing business rule validation.
   - **Repository / Prisma**: Unique constraint violation (P2002), foreign key violation (P2003), connection timeout.
   - **Queue / BullMQ**: Redis lock expiration, job deserialization error.
   - **Frontend**: Undefined property access, stale TanStack Query cache, unhandled promise.

### Phase 2: Root Cause Tracing
- Ask "Why did this occur?" five times to reach the systemic root cause.
- Never patch an issue by suppressing an error or adding `any` type casts.
- Check `.agents/context/KNOWN_FOOTGUNS.md` for known recurring traps.

### Phase 3: Surgical Fix & Regression Verification
- Fix the issue in the appropriate layer.
- Add an automated test replicating the bug to prevent regressions.
- Verify with `npx tsc --noEmit`.


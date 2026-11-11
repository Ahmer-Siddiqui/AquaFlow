# Rule 10: Refactoring & Architecture Evolution Standards

## 🔄 Disciplined Refactoring Guidelines

1. **Strangler Fig Pattern for New Capabilities**:
   - Introduce new features alongside existing working modules without modifying core shared contracts until new modules are thoroughly tested.

2. **Database Migration Safety**:
   - Never drop a column in production without a 2-phase migration:
     - Phase 1: Make column nullable, update application code to stop reading/writing it.
     - Phase 2: Drop column in a subsequent release.
   - For enum additions: PostgreSQL `ALTER TYPE ... ADD VALUE` requires careful transaction handling in Prisma migrations.

3. **Dependency Inversion Safeguard**:
   - Never let a domain module directly import another domain module's repository.
   - If Module A needs Module B's capability, inject `I<B>Service` or emit a domain event.

4. **Zero Regression Policy**:
   - Before completing any refactoring task, run the full test suite and verify `npx tsc --noEmit` exits with code 0.


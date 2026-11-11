---
name: refactor-module
description: "Disciplined procedure for refactoring, modernizing, or restructuring any domain module in AquaFlow to adhere to Clean Architecture, SOLID principles, and 4-tier layer decoupling."
metadata:
  author: aquaflow-architect
  version: "1.0.0"
---

# Module Refactoring Playbook (AquaFlow)

Use this skill whenever refactoring legacy logic or introducing architectural improvements to an existing AquaFlow module.

---

## 🔄 The 5-Step Refactoring Sequence

1. **Safety Net (Tests First)**:
   - Ensure existing tests pass before touching any code. If no tests exist, write integration tests capturing existing behavior.
2. **Interface Abstraction**:
   - Extract repository and service interfaces (`I<Entity>Repository.ts`, `I<Entity>Service.ts`).
3. **Decouple Layer Responsibilities**:
   - Strip all database queries from controllers. Move to repositories.
   - Strip all HTTP `req/res` references from services. Return pure DTOs or entities.
4. **Update Composition Root (`container.ts`)**:
   - Wire the refactored classes into the central DI container.
5. **Verify Compilability & Tests**:
   - Run `npx tsc --noEmit` and execute all test suites. Ensure 0 regressions.


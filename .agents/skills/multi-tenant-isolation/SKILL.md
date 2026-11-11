---
name: multi-tenant-isolation
description: "Guidelines and verification protocols for enforcing strict multi-tenant data isolation in AquaFlow, preventing tenant data leaks, validating tenant context, and writing automated tenant isolation test suites."
metadata:
  author: aquaflow-architect
  version: "1.0.0"
---

# Multi-Tenant Isolation Playbook (AquaFlow)

Use this skill whenever working on authentication, authorization, query scoping, middleware guards, or writing multi-tenant tests.

---

## 🔒 1. Tenant Scoping Protocol

1. **Extraction**:
   - The active `businessId` is derived from the verified user session / JWT token claims (`req.user.activeBusinessId`).
   - If the user has multiple business memberships, they can switch active business via `POST /api/v1/auth/switch-business`, which issues a refreshed token.

2. **Validation (`tenantScopeGuard`)**:
   - Ensure `req.user.memberships` contains `req.params.businessId` or `req.headers['x-business-id']`.
   - Never allow a user to perform an action on a `businessId` they do not actively belong to.

3. **Repository Enforcement**:
   - Every repository method that touches a tenant-scoped table MUST include:
     ```typescript
     where: {
       id,
       businessId
     }
     ```
   - If no record is found with both `id` AND `businessId`, return `null` (which the service converts to `404 Not Found`).

---

## 🧪 2. Automated Tenant Isolation Verification

Every module must include a tenant isolation test:
```typescript
it('should reject access to another tenant resource', async () => {
  // Given: An order belonging to Business A
  const orderA = await createTestOrder(businessA.id);

  // When: Authenticated user of Business B tries to fetch orderA
  const response = await request(app)
    .get(`/api/v1/orders/${orderA.id}`)
    .set('Authorization', `Bearer ${tokenUserB}`);

  // Then: Must return 404 Not Found (or 403 Forbidden)
  expect(response.status).toBe(404);
});
```


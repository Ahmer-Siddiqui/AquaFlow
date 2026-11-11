# Module 01: Authentication, Identity & Session Management

## 🎯 Domain Scope & Objectives
Manage global user identity, secure authentication, password hashing, access and refresh token lifecycle, and session revocation across all four AquaFlow interfaces.

---

## 🗄️ Relational Entities

### `User`
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `phone`: String (Unique)
- `passwordHash`: String (Argon2id or bcrypt)
- `firstName`: String
- `lastName`: String
- `avatarUrl`: String (Optional)
- `isSuperAdmin`: Boolean (Default: false)
- `isActive`: Boolean (Default: true)
- `isEmailVerified`: Boolean (Default: false)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `RefreshToken`
- `id`: UUID (Primary Key)
- `userId`: UUID (FK -> User.id)
- `tokenHash`: String (Hashed refresh token)
- `family`: UUID (Token rotation family to detect reuse)
- `expiresAt`: DateTime
- `revokedAt`: DateTime (Optional)
- `userAgent`: String (Optional)
- `ipAddress`: String (Optional)

---

## 🔒 Security Invariants
1. Passwords hashed using **Argon2id** (or bcrypt with salt rounds >= 12).
2. Access tokens are short-lived JWTs (15 minutes).
3. Refresh tokens are long-lived (7 days) stored in secure, `httpOnly`, `sameSite=strict`, `secure` cookies.
4. **Token Family Rotation**: If a revoked refresh token is presented, invalidate the entire token family immediately (detecting token theft).
5. Never return `passwordHash` or sensitive tokens in API response bodies.


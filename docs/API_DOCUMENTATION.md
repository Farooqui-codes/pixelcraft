# PixelCraft REST API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Authentication Endpoints

### `POST /api/auth/signup`
Creates a new user profile with encrypted password hashing and initializes a free subscription tier.
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "full_name": "Alex Morgan",
    "primary_use": "creator",
    "business_name": "Optional Studio",
    "referral_code": "OptionalRefCode"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully!",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "pc_...",
      "email": "user@example.com",
      "full_name": "Alex Morgan",
      "role": "user",
      "plan": "free"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates an existing user and returns a JWT session token.
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```

### `GET /api/auth/me`
Returns the currently authenticated user's profile and workspace usage statistics. Requires Bearer Token.

### `PUT /api/auth/profile`
Updates user profile fields (`full_name`, `primary_use`, `business_name`, `avatar_url`).

### `POST /api/auth/change-password`
Changes account password verifying the current password against bcrypt hash.

### `POST /api/auth/forgot-password`
Generates a secure password reset token for account recovery.

### `POST /api/auth/reset-password`
Verifies the recovery token and applies a new password.

---

## 2. Tools Catalog & Analytics

### `GET /api/tools`
Returns all 30 tool definitions with category, keywords, accent colors, and tier metadata.
- **Query Parameters:**
  - `category` (e.g. `image`, `pdf`, `creator`, `business`, `qr`, `invitation`, `text`, `developer`)
  - `search` (text query)

### `GET /api/tools/:id`
Retrieves a single tool definition.

### `POST /api/tools/log-usage`
Logs execution of a tool for analytics and user recent history.

### `GET /api/tools/user/recent`
Returns the authenticated user's recent tool execution history.

### `POST /api/tools/process/pdf-merge`
Server-side high-throughput multipart PDF merging using `pdf-lib`.

---

## 3. Projects CRUD (Workspace)

### `GET /api/projects`
Lists projects owned by the authenticated user with sorting, pagination, and category filtering.

### `GET /api/projects/:id`
Retrieves a specific project. Enforces strict user isolation (returns 403 Forbidden if accessed by another user).

### `POST /api/projects`
Saves a new creation to the cloud. Enforces plan limits:
- Free: 5 projects
- Pro: 50 projects
- Business: 500 projects

### `PUT /api/projects/:id`
Updates and autosaves a project, automatically incrementing the version counter.

### `POST /api/projects/:id/duplicate`
Creates a copy of an existing project.

### `DELETE /api/projects/:id`
Permanently deletes a project.

### `POST /api/projects/bulk-delete`
Deletes multiple projects safely in a single batch operation.

---

## 4. Favorites

### `GET /api/favorites`
Returns an array of tool IDs favorited by the user.

### `POST /api/favorites/toggle`
Toggles a tool's favorite status.

---

## 5. Contact & Support

### `POST /api/contact`
Submits an inquiry or support message to the database:
- **Payload:** `{ "name": "...", "email": "...", "subject": "...", "message": "..." }`
- **Response:** `{ "success": true, "ticketId": "..." }`

---

## 6. Subscriptions & Billing

### `GET /api/subscriptions/plans`
Returns active subscription plans and feature limits.

### `GET /api/subscriptions/current`
Returns current user subscription and project capacity metrics.

### `POST /api/subscriptions/upgrade`
Upgrades account plan to Pro or Business.

### `GET /api/subscriptions/referrals`
Returns user referral code, invite link, and verified referrals count.

---

## 7. Admin Endpoints (Role: `admin` required)

### `GET /api/admin/stats`
Returns system metrics: total users, projects, tool runs, revenue, plan breakdowns, and popular tools.

### `GET /api/admin/users`
Lists all registered users with search, role filter, and plan filter.

### `PUT /api/admin/users/:id`
Updates a user's role (`user`, `admin`) or subscription plan (`free`, `pro`, `business`).

### `DELETE /api/admin/users/:id`
Permanently removes a user account and associated projects.

### `GET /api/admin/support`
Lists all support tickets.

### `PUT /api/admin/support/:id`
Updates ticket status (`open`, `in_progress`, `resolved`, `closed`).

### `GET /api/admin/settings`
Retrieves platform settings.

### `PUT /api/admin/settings/:key`
Updates a platform setting (e.g., pricing, maintenance mode).


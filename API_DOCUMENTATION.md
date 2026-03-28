# API Documentation — Phỉ Thúy Lê Công Backend

> **Base URL**: `http://localhost:3000`  
> **Auth**: Protected routes require `Authorization: Bearer <token>` in the request header.  
> **Password rules**: ≥ 8 characters, at least 1 uppercase letter, at least 1 digit.

---

## 🛍️ Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/products` | No | Get all products |
| `POST` | `/api/admin/products` | No* | Add a new product. Images sent as base64 — saved to `/uploads/products/<id>/` |
| `PUT` | `/api/admin/products/:id` | No* | Update a product. Images are reprocessed; removed images are deleted from disk |
| `DELETE` | `/api/admin/products/:id` | No* | Delete a product and its upload folder |

> \*These admin product routes do not currently enforce JWT.

---

## 📦 Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/orders` | No | Place a new order. Validates phone (≥10 digits), address (≥5 chars), voucher eligibility, and receipt size (≤7 MB). Auto-generates `ORD-XXXX` ID if none provided |
| `GET` | `/api/admin/orders` | No* | Get all orders (admin) |
| `PUT` | `/api/admin/orders/:id/status` | No* | Update order status. **Sends a feedback request email** when status transitions into `Delivered / Đã Giao / Hoàn Thành` |
| `DELETE` | `/api/admin/orders/:id` | No* | Delete an order |

### Order Feedback

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/orders/:id/feedback` | No | Submit a rating (1–5) and optional comment. Each order only accepts one feedback |
| `GET` | `/api/admin/orders/:id/feedback` | No | Get the feedback for a specific order (admin) |

---

## 🔐 Auth (Customer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/request-verification` | No | Send a 6-digit email verification code (expires 15 min). Rejects if email already registered |
| `POST` | `/api/auth/register` | No | Register. Requires `email`, `password`, `name`, `code`. Issues JWT + sends welcome voucher email |
| `POST` | `/api/auth/login` | No | Log in. Returns JWT (24h) and user profile |
| `POST` | `/api/auth/forgot-password` | No | Send a password reset link (valid 1 hour) |
| `POST` | `/api/auth/reset-password` | No | Reset password using the token from email |
| `POST` | `/api/auth/profile/forgot-password` | **Yes** | Send a 6-digit code to the logged-in user's email (in-app reset flow) |
| `POST` | `/api/auth/profile/reset-password-with-code` | **Yes** | Reset password using a verification code while logged in |

---

## 👤 User Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users/profile` | **Yes** | Get current user's profile (password excluded) |
| `PUT` | `/api/users/profile` | **Yes** | Update `name`, `phone` (≥10 digits), and `address` (≥5 chars) |
| `PUT` | `/api/users/profile/password` | **Yes** | Change password. Requires `currentPassword` and `newPassword` |
| `GET` | `/api/users/orders` | **Yes** | Get all orders placed by the current user |

### Wishlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users/wishlist` | **Yes** | Get all wishlist items |
| `POST` | `/api/users/wishlist/:productId` | **Yes** | Add a product to the wishlist |
| `DELETE` | `/api/users/wishlist/:productId` | **Yes** | Remove a product from the wishlist |
| `GET` | `/api/users/wishlist/:productId/check` | **Yes** | Check if a product is wishlisted → `{ inWishlist: boolean }` |

---

## 🎟️ Vouchers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/vouchers/:code` | No | Look up a voucher by code. Returns 404 if not found/inactive |
| `POST` | `/api/vouchers/validate` | No | Validate a voucher for `{ code, email, orderValue }`. Checks: active, global limit, per-user usage, user binding, min spending tier, min order value |
| `GET` | `/api/vouchers/available` | No | List available vouchers for a user. Query: `?email=` (optional). Filters exhausted, already-used, and ineligible |
| `GET` | `/api/admin/vouchers` | No* | Get all vouchers (admin) |
| `POST` | `/api/admin/vouchers` | No* | Create a voucher |
| `PUT` | `/api/admin/vouchers/:id` | No* | Update a voucher |
| `DELETE` | `/api/admin/vouchers/:id` | No* | Delete a voucher |

---

## 📣 Promotions (Banners)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/promotions` | No | Get all promotions (public, for homepage banners) |
| `GET` | `/api/admin/promotions` | No* | Get all promotions (admin) |
| `POST` | `/api/admin/promotions` | No* | Add a promotion |
| `PUT` | `/api/admin/promotions/:id` | No* | Update a promotion |
| `DELETE` | `/api/admin/promotions/:id` | No* | Delete a promotion |

---

## 📝 Blogs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/blogs` | No | Get all **published** blogs |
| `GET` | `/api/blogs/featured` | No | Get **featured & published** blogs |
| `GET` | `/api/blogs/:slug` | No | Get a single published blog by slug |
| `GET` | `/api/admin/blogs` | No* | Get **all** blogs including drafts (admin) |
| `POST` | `/api/admin/blogs` | No* | Create a blog. `multipart/form-data` with optional `image` file. Booleans coerced from strings |
| `PUT` | `/api/admin/blogs/:id` | No* | Update a blog. New image upload deletes old file. Send `image_url` to keep existing image |
| `DELETE` | `/api/admin/blogs/:id` | No* | Delete a blog and its image file |

---

## 🗂️ Collections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/collections` | No | Get all product collections |
| `POST` | `/api/admin/collections` | **Yes** | Add a collection |
| `PUT` | `/api/admin/collections/:id` | **Yes** | Update a collection |
| `DELETE` | `/api/admin/collections/:id` | **Yes** | Delete a collection |

---

## ⚙️ Settings

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings/bank` | Bank info: name, account number, QR image URL |
| `GET` | `/api/settings/social` | Social links: Facebook, TikTok, Instagram, Telegram, Zalo |
| `GET` | `/api/settings/contact` | Contact info: address, phone, email, working hours |

### Admin-only (requires `role: 'admin'` in JWT)

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/admin/settings` | Update admin email/password. Re-issues a new JWT on success |
| `PUT` | `/api/admin/settings/bank` | Update bank details. `multipart/form-data` with optional `bankQR` upload. Old QR deleted from disk |
| `PUT` | `/api/admin/settings/social` | Update social media links |
| `PUT` | `/api/admin/settings/contact` | Update contact info |

---

## 👮 Admin Accounts (requires `role: 'admin'` in JWT)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/auth/login` | Admin login. Returns JWT with `role: 'admin'` |
| `POST` | `/api/admin/auth/forgot-password` | Send admin reset link. Response is always success to prevent email enumeration |
| `POST` | `/api/admin/auth/reset-password` | Reset admin password via token |
| `GET` | `/api/admin/admins` | List all admin accounts |
| `POST` | `/api/admin/admins` | Create a new admin account |
| `DELETE` | `/api/admin/admins/:id` | Delete an admin account |

---

## 🔍 Search Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/search/log` | No | Log a search keyword. Body: `{ keyword }` |
| `GET` | `/api/admin/search-analytics` | No* | Get aggregated keyword statistics |
| `DELETE` | `/api/admin/search-analytics` | No* | Clear all search analytics data |

---

## 🌐 Translation (Admin utility)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/admin/translate` | No* | Translate text via Google Translate. Body: `{ text, from?, to? }` (default: `vi → en`) |

---

## 📁 Static File Serving

| Path | Description |
|------|-------------|
| `/uploads/products/<id>/` | Product images |
| `/uploads/blogs/` | Blog cover images |
| `/uploads/bank/` | Bank QR code images |

---

## 🔑 Auth Notes

- **User JWT** payload: `{ id, email }` — 24h expiry
- **Admin JWT** payload: `{ id, email, role: 'admin' }` — same secret, same expiry
- Admin-only routes check `req.user.role === 'admin'` and return `403` if the check fails
- The `authenticateToken` middleware verifies the JWT and attaches `req.user` to the request

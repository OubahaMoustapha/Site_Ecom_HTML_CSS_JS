# E-Commerce REST API — Project Guide

This guide explains how the API works, why it is designed this way, and how to test it step by step in Postman.

---

## 1. Overview

A REST API for an online store, built with **Laravel 13** and **PHP 8.3**. It covers:

| Area | What it provides |
|---|---|
| Catalog | Products, categories, brands, images, attributes (e.g. size, color) and product variants |
| Inventory | Quantity per variant, low-stock alerts, and a full history of every stock movement |
| Users | Registration, login, email verification, password reset, profile management |
| Shopping | Cart, orders with a shipping address, cancellation, payment, PDF invoice sent by email |
| Administration | User roles (`customer` / `admin`), catalog and inventory management, order status tracking |

**Tech stack:**

- **Laravel Sanctum** for token authentication
- **Eloquent ORM** for database access
- **MySQL** in development and **SQLite** (in memory) for automated tests
- **DomPDF** for invoices
- **PHPUnit** for tests

---

## 2. Running Locally

```bash
cd ecommerce-api
composer install
cp .env.example .env          # then set DB_* and MAIL_*
php artisan key:generate

php artisan migrate            # creates tables (including role and shipping columns)
php artisan db:seed            # customer + admin + demo catalog
php artisan storage:link       # serves uploaded product images

php artisan serve              # http://localhost:8000
```

**Seeded accounts** (password for both: `password`):

| Email | Role |
|---|---|
| `test@example.com` | customer |
| `admin@example.com` | admin |

**Promote an existing user to administrator:**

```bash
php artisan user:make-admin someone@example.com
```

**Run the automated tests:**

```bash
php artisan test
```

> Tests run on an in-memory SQLite database, so they never touch your real data.

---

## 3. Architecture: How a Request Flows

Every HTTP request goes through the same chain. Each layer has a single responsibility:

```
Request
  │
  ▼
routes/api.php ──────────── maps the URL to a controller
  │
  ▼
Middleware ──────────────── auth:sanctum (is the user logged in?)
  │                         admin (is the user an administrator?)
  │                         throttle (rate limiting)
  ▼
Form Request ────────────── input validation (app/Http/Requests)
  │                         invalid data -> 422 automatically
  ▼
Controller ──────────────── thin: receives the request, calls a service, returns the response
  │
  ▼
Service ─────────────────── business logic (app/Services)
  │                         transactions, locks, stock and order rules
  ▼
Model (Eloquent) ────────── tables and relationships (app/Models)
  │
  ▼
API Resource ────────────── final JSON shape (app/Http/Resources)
```

**Why this split?**

- **Form Requests** validate input before it reaches the controller, so controllers stay clean and error messages are consistent.
- **Services** keep complex business logic in one reusable, testable place. For example, creating an order touches five tables, and all of that lives in `OrderService`, which in turn uses `InventoryService` instead of duplicating stock logic.
- **Resources** decouple the database schema from the response shape, so sensitive fields such as `password` never leak.

**Key files:**

| File | Role |
|---|---|
| `routes/api.php` | All routes, split into public, authenticated and admin groups |
| `app/Services/OrderService.php` | Checkout, cancellation, status changes |
| `app/Services/InventoryService.php` | Every quantity change goes through here and is logged |
| `app/Services/PaymentService.php` | Payment and the invoice email event |
| `app/Http/Middleware/EnsureUserIsAdmin.php` | Protects admin routes |
| `app/Models/Order.php` | Order statuses and allowed transitions |

---

## 4. Data Model

```
users ──1:1── carts ──1:N── cart_items ──N:1──┐
  │                                           │
  └──1:N── orders ──1:N── order_items ──N:1───┤
             │                                ▼
             └──1:1── payments       product_variants ──1:1── inventories
                                         │    │
categories ──1:N──┐                      │    └──1:N── stock_movements
                  ▼                      │
brands ──1:N── products ──1:N────────────┘
                  │
                  └──1:N── product_images

product_variants ──N:M── attribute_values   (pivot table: variant_attribute_values)
attributes ──1:N── attribute_values
```

**Core concepts:**

- **Product vs. Variant:** a product is "Classic T-Shirt"; a variant is "Classic T-Shirt, size M", with its own `sku` and price. **The cart and orders always work with variants, not products.**
- **Inventory:** one record per variant in `inventories`, holding the current quantity and a `low_stock_threshold`.
- **Stock movements:** every quantity change is recorded in `stock_movements` with its type (`in`, `out` or `adjustment`), the quantity before the change, and a note explaining why. It answers the question "why did this quantity change?".
- **Order items as a snapshot:** when an order is placed, the product name, `sku` and price are copied into `order_items`. If a product price changes later, past orders stay correct.
- **Role:** the `role` column on `users` defaults to `customer`. It is **not mass-assignable**, so nobody can make themselves an admin by sending `"role": "admin"` during registration.

> **Note:** `products.price` and `products.stock` are legacy fields from an earlier version and are still required when creating a product. The actual selling price and the real stock are read from the variant (`product_variants.price`) and the inventory (`inventories.quantity`).

---

## 5. Authentication and Roles

The API uses **Laravel Sanctum personal access tokens**:

1. `POST /api/auth/login` returns a `token`.
2. Every protected request sends it in the header:
   ```
   Authorization: Bearer <token>
   ```
3. `POST /api/auth/logout` revokes the current token only; other devices stay logged in.

**Access levels:**

| Level | Middleware | Examples |
|---|---|---|
| Public | — | Browsing products, categories, brands, variants |
| Authenticated user | `auth:sanctum` | Cart, orders, payments, profile |
| Administrator | `auth:sanctum` + `admin` | Catalog and inventory management, `/api/admin/orders` |

**Brute-force protection:** `register`, `login`, `forgot-password` and `reset-password` use the named `auth` rate limiter (defined in `AppServiceProvider`):

| Limit | Key | Purpose |
|---|---|---|
| 6 requests / minute | email + IP | Slows down password guessing on one account. Other users on the same IP (office, campus) are **not** blocked |
| 30 requests / minute | IP | Stops one client from trying many different emails |

`email/resend` (authenticated) is limited to 6 requests per minute per user. Any request over a limit returns `429`.

---

## 6. Response Format and Status Codes

**Success (single item or action):**

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": { "...": "..." }
}
```

**Paginated lists** (products, categories, brands, variants, inventories, stock movements, admin orders). Use `?page=2` for the next page:

```json
{
  "data": [],
  "links": { "first": "...", "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 10, "total": 25 }
}
```

**Validation error (422):**

```json
{
  "message": "The shipping city field is required.",
  "errors": { "shipping_city": ["The shipping city field is required."] }
}
```

| Code | Meaning in this API |
|---|---|
| 200 | Success |
| 201 | Created (registration, product, order, payment...) |
| 401 | Missing or invalid token |
| 403 | Authenticated but not an administrator |
| 404 | Resource not found |
| 409 | Conflict, e.g. deleting a variant that has already been ordered |
| 422 | Invalid data or rejected business rule (insufficient stock, order not cancellable, another user's order...) |
| 429 | Too many attempts |

> **Note:** accessing another user's order or payment currently returns `422` with a message, not `403`/`404`. This legacy behavior was kept so the contract with the frontend does not change.

---

## 7. Endpoint Reference

Base URL: `http://localhost:8000/api`

### 7.1 Authentication — `/auth`

| Method | URL | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | Public (throttled) | `name`, `email`, `password`, `password_confirmation`, `device_name` |
| POST | `/auth/login` | Public (throttled) | `email`, `password`, `device_name` |
| POST | `/auth/forgot-password` | Public (throttled) | `email` |
| POST | `/auth/reset-password` | Public (throttled) | `token`, `email`, `password`, `password_confirmation` |
| GET | `/auth/email/verify/{id}/{hash}` | Signed link from the email | — |
| POST | `/auth/logout` | Authenticated | — |
| GET | `/auth/me` | Authenticated | — |
| PUT | `/auth/profile` | Authenticated | `name`, `email` (changing the email resets verification and sends a new link) |
| PUT | `/auth/change-password` | Authenticated | `current_password`, `password`, `password_confirmation` |
| POST | `/auth/email/resend` | Authenticated (throttled) | — |

### 7.2 Catalog

Reading is public; writing is admin-only.

| Resource | Read (public) | Write (admin) |
|---|---|---|
| Products | `GET /products`, `GET /products/{id}` | `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Categories | `GET /categories`, `GET /categories/{id}` | `POST`, `PUT`, `DELETE` (same pattern) |
| Brands | `GET /brands`, `GET /brands/{id}` | `POST`, `PUT`, `DELETE` (same pattern) |
| Product images | `GET /products/{id}/images` | `POST /products/{id}/images` (form-data), `DELETE /products/{id}/images/{imageId}` |
| Attributes | `GET /attributes`, `GET /attributes/{id}` | `POST`, `PUT`, `DELETE` (same pattern) |
| Attribute values | `GET /attribute-values`, `GET /attribute-values/{id}` | `POST`, `PUT`, `DELETE` (same pattern) |
| Product variants | `GET /product-variants`, `GET /product-variants/{id}` | `POST`, `PUT`, `DELETE` (same pattern) |

**`GET /products` filters:**

| Parameter | Example | Description |
|---|---|---|
| `search` | `?search=shirt` | Search by product name |
| `category_id` | `?category_id=1` | Products in a category |
| `brand_id` | `?brand_id=1` | Products of a brand |
| `min_price` / `max_price` | `?min_price=10&max_price=50` | Price range |
| `is_active` | `?is_active=true` | Active or inactive products |
| `sort` | `?sort=price`, `?sort=-price` | Sort by `price`, `name` or `created_at`; a leading `-` means descending |

- **`GET /products/{id}`** returns the product with its `images` and `variants`; each variant includes `stock` and `attribute_values`. This is what a product details page needs to know which `product_variant_id` to add to the cart.
- **`GET /product-variants?product_id=1`** returns the variants of a single product.
- **Protected deletion:** a product or variant that has already been ordered cannot be deleted; the API returns `409`. Deleting it would have erased past order items because of `cascadeOnDelete`. The correct approach is to deactivate it with `"is_active": false`.

### 7.3 Inventory (admin only)

| Method | URL | Body / Notes |
|---|---|---|
| GET | `/inventories` | List |
| GET | `/inventories/low-stock` | Quantity ≤ `low_stock_threshold` |
| POST | `/inventories` | `product_variant_id`, `quantity`, `low_stock_threshold` (one record per variant) |
| GET | `/inventories/{id}` | — |
| PUT | `/inventories/{id}` | `quantity`, `low_stock_threshold` (direct edit, **no** movement logged) |
| DELETE | `/inventories/{id}` | — |
| GET | `/stock-movements` | Movement history |
| POST | `/stock-movements` | `product_variant_id`, `type` (`in` / `out` / `adjustment`), `quantity`, `note` |
| GET | `/stock-movements/{id}` | — |

> To change a quantity while keeping an audit trail, use `POST /stock-movements`, not `PUT /inventories`:
> - `in` adds the quantity to the stock.
> - `out` subtracts it, and is rejected with `422` if the stock is insufficient.
> - `adjustment` sets the stock to exactly the given value (e.g. after a physical count).

### 7.4 Cart (authenticated)

| Method | URL | Body |
|---|---|---|
| GET | `/cart` | — (the cart is created automatically on first use) |
| POST | `/cart` | `product_variant_id`, `quantity` (if the variant is already in the cart, quantities are added) |
| PATCH | `/cart/items/{cartItemId}` | `quantity` |
| DELETE | `/cart/items/{cartItemId}` | — |
| DELETE | `/cart` | Empties the cart |

The response includes `items_count`, `total_quantity` and `total`; each item includes its `subtotal`.

### 7.5 Orders (authenticated)

| Method | URL | Body / Notes |
|---|---|---|
| GET | `/orders` | My orders |
| POST | `/orders` | Creates an order from the cart (fields below) |
| GET | `/orders/{id}` | — |
| POST | `/orders/{id}/cancel` | Only when the status is `pending` |
| GET | `/orders/{id}/invoice` | PDF invoice including the shipping address (unpaid orders show payment status `Unpaid`) |

**`POST /orders` fields:**

| Field | Required |
|---|---|
| `shipping_name` | Yes |
| `shipping_phone` | Yes |
| `shipping_address` | Yes |
| `shipping_city` | Yes |
| `shipping_country` | Yes |
| `shipping_postal_code` | No |
| `notes` | No |

### 7.6 Payments (authenticated)

| Method | URL | Body |
|---|---|---|
| GET | `/payments` | My payments |
| POST | `/payments` | `order_id`, `method` (`cash` / `card` / `paypal`) |
| GET | `/payments/{id}` | — |

### 7.7 Order Management (admin only) — `/admin`

| Method | URL | Body / Query |
|---|---|---|
| GET | `/admin/orders` | `?status=paid`, `?user_id=3` (15 orders per page) |
| GET | `/admin/orders/{id}` | Order with its user and payment |
| PATCH | `/admin/orders/{id}/status` | `status`: `processing` / `shipped` / `completed` / `cancelled` |

---

## 8. Order Lifecycle

```
                 POST /payments
   ┌─────────┐  ───────────────►  ┌──────┐  admin  ┌────────────┐  admin  ┌─────────┐  admin  ┌───────────┐
   │ pending │                    │ paid │ ──────► │ processing │ ──────► │ shipped │ ──────► │ completed │
   └─────────┘                    └──────┘         └────────────┘         └─────────┘         └───────────┘
        │                            │                    │
        │ customer or admin          │ admin              │ admin
        ▼                            ▼                    ▼
   ┌────────────────────────────────────────────────────────────┐
   │ cancelled  -> stock restored, existing payment -> refunded │
   └────────────────────────────────────────────────────────────┘
```

The rules live in `Order::STATUS_TRANSITIONS`; any other transition is rejected with `422`. For example, `processing → completed` is rejected because it skips `shipped`.

### What happens on `POST /orders`?

All steps run inside **a single database transaction**:

1. Load the cart. If it is empty → `422`.
2. For each item: check that the variant is active, then **lock** its inventory row (`lockForUpdate`) and check that the quantity is sufficient.
3. Create the order with the shipping details.
4. Create `order_items` as a snapshot of name and price.
5. Decrease stock through `InventoryService`, logging an `out` movement with `quantity_before` and the note `Customer order #ID`.
6. Empty the cart.

If any step fails, **everything is rolled back**, so no half-created order is ever left behind.

### Why lock?

Imagine two customers buying the last item at the same moment. Without a lock, both could read "1 available" and both orders would succeed, leaving the stock negative. With the lock, the second request waits until the first finishes, then reads the new quantity (0) and is rejected. The same idea is applied to payments to prevent paying the same order twice.

### What happens on `POST /payments`?

1. Lock the order and check that it belongs to the user, is `pending`, and has not been paid yet.
2. Create the payment with status `paid` and move the order to `paid`.
3. **After** the transaction commits, the `PaymentCompleted` event fires and the queued listener `SendInvoiceEmail` emails the PDF invoice. If the email fails, the payment is **not** rolled back.

### Invoice email delivery modes

The listener's queue connection is set by `MAIL_QUEUE_CONNECTION` (default `sync`):

| Value | Behavior | Worker needed | Use for |
|---|---|---|---|
| `sync` (default) | Sent during the payment request; failures are logged | No | Local development |
| `deferred` | Sent right after the response; failures are logged | No | A server running PHP-FPM |
| `database` | Pushed to the `jobs` table; retried 3 times, 60s apart | Yes: `php artisan queue:work` | Production |

```bash
# .env on a production server
MAIL_QUEUE_CONNECTION=database

# keep a worker running (e.g. with Supervisor)
php artisan queue:work
```

> Measured locally (Gmail SMTP): a payment takes about 8–18 s with `sync`. With `deferred` it is not faster under `php artisan serve`, because PHP's built-in server keeps the connection open until the deferred work ends; the gain appears only under PHP-FPM.

---

## 9. Postman Test Scenarios

### 9.1 Setup

**1. Create an Environment** named `ecommerce-local` with these variables:

| Variable | Initial value |
|---|---|
| `base_url` | `http://localhost:8000/api` |
| `customer_token` | (empty) |
| `admin_token` | (empty) |
| `variant_id` | (empty) |
| `cart_item_id` | (empty) |
| `order_id` | (empty) |

**2. Create a Collection** and configure:

- A collection-level header, so Laravel always returns JSON:
  ```
  Accept: application/json
  ```
- **Authorization:** type `Bearer Token` with value `{{customer_token}}`. For admin requests, switch it to `{{admin_token}}`.

**3. Prepare the data:**

```bash
php artisan migrate:fresh --seed
```

> ⚠️ This command **deletes all data** and recreates the tables. Use it on the development database only.

It creates the product `Classic T-Shirt` with two variants:

| SKU | Stock |
|---|---|
| `TSHIRT-S` | 20 |
| `TSHIRT-M` | 3 |

**4. Auto-save scripts** (in the **Post-response** / **Tests** tab of each request):

```js
// POST /auth/login (customer)
pm.environment.set("customer_token", pm.response.json().data.token);

// POST /auth/login (admin)
pm.environment.set("admin_token", pm.response.json().data.token);

// GET /products/1 -> first variant
pm.environment.set("variant_id", pm.response.json().data.variants[0].id);

// POST /cart -> first cart item
pm.environment.set("cart_item_id", pm.response.json().data.items[0].id);

// POST /orders
pm.environment.set("order_id", pm.response.json().data.id);

// Generic status check (can be added to any request)
pm.test("status is 200 or 201", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));
```

---

### 9.2 Scenario A — Full Purchase Flow (happy path)

| # | Request | Expected result |
|---|---|---|
| A1 | `POST /auth/login` (customer) | 200 + `data.token` → save to `customer_token` |
| A2 | `GET /products` | 200, list contains `Classic T-Shirt` and `meta.total` |
| A3 | `GET /products/1` | 200, `data.variants` has two variants, each with `stock` → save `variant_id` |
| A4 | `POST /cart` (quantity 2) | 200, `items_count: 1`, `total` = price × 2 |
| A5 | `GET /cart` | Same cart |
| A6 | `POST /orders` (with shipping details) | 201, `status: pending`, `shipping.city` present → save `order_id` |
| A7 | `GET /cart` | `items_count: 0` (cart emptied) |
| A8 | `POST /payments` | 201, `status: paid` |
| A9 | `GET /orders/{{order_id}}` | `status: paid` |
| A10 | `GET /orders/{{order_id}}/invoice` | PDF file (use **Send and Download**) |
| A11 | `GET /payments` | The payment is listed |

**Extra check** with the admin token: `GET /stock-movements` shows an `out` movement with quantity 2, `quantity_before: 20`, and the note `Customer order #...`.

```jsonc
// A1  POST {{base_url}}/auth/login
{ "email": "test@example.com", "password": "password", "device_name": "postman" }

// A4  POST {{base_url}}/cart
{ "product_variant_id": {{variant_id}}, "quantity": 2 }

// A6  POST {{base_url}}/orders
{
  "shipping_name": "Ali",
  "shipping_phone": "0600000000",
  "shipping_address": "1 Rue X",
  "shipping_city": "Casablanca",
  "shipping_country": "Morocco"
}

// A8  POST {{base_url}}/payments
{ "order_id": {{order_id}}, "method": "card" }
```

---

### 9.3 Scenario B — Authorization and Security

| # | Request | Setup | Expected result |
|---|---|---|---|
| B1 | `POST /products` | **No** Authorization | 401 |
| B2 | `POST /products` | `customer_token` | 403 `"This action is restricted to administrators."` |
| B3 | `POST /auth/login` (admin account) | — | 200 → save `admin_token` |
| B4 | `POST /products` | `admin_token` | 201 |
| B5 | `GET /inventories` | `customer_token` | 403 |
| B6 | `GET /admin/orders` | `customer_token` | 403 |
| B7 | `POST /auth/register` with `"role": "admin"` in the body | — | 201, but `data.user.role` is `customer` (field ignored) |
| B8 | Register a second user, then `GET /orders/{{order_id}}` with their token | Second user's token | 422 `You are not authorized to access this order.` |
| B9 | Same second user: `POST /payments` on `{{order_id}}` | Second user's token | 422 |
| B10 | `POST /auth/login` with a wrong password 7 times in a row (same email) | — | Attempts 1–6: 422; attempt 7: **429** |
| B11 | Right after B10, `POST /auth/login` with a **different** email | — | 422 (not blocked: the limit is per email + IP) |

```jsonc
// B4  POST {{base_url}}/products   (admin_token)
{ "name": "Hoodie", "slug": "hoodie", "price": 39.9, "stock": 0, "category_id": 1, "brand_id": 1 }

// B7  POST {{base_url}}/auth/register
{
  "name": "Sneaky User",
  "email": "sneaky@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "device_name": "postman",
  "role": "admin"
}
```

---

### 9.4 Scenario C — Inventory Rules

This scenario uses the `TSHIRT-M` variant (stock 3), referred to as `M_ID`.

| # | Request | Expected result |
|---|---|---|
| C1 | `POST /cart` (customer), quantity 5 | 422 `Only 3 item(s) available in stock.` |
| C2 | `POST /cart`, quantity 3 | 200 |
| C3 | `POST /cart` again, quantity 1 | 422 (total would be 4 > 3) |
| C4 | `POST /stock-movements` (admin), `out` 999 | 422 `Insufficient stock...` |
| C5 | `POST /stock-movements` (admin), `in` 10 | 201, `quantity_before: 3`, stock is now 13 |
| C6 | `GET /inventories/low-stock` (admin) | `TSHIRT-M` is not listed (13 > threshold 5) |
| C7 | `POST /stock-movements` (admin), `adjustment` 2 | Stock becomes exactly 2 and appears in `low-stock` |

```jsonc
// C1  POST {{base_url}}/cart
{ "product_variant_id": M_ID, "quantity": 5 }

// C4  POST {{base_url}}/stock-movements   (admin_token)
{ "product_variant_id": M_ID, "type": "out", "quantity": 999 }

// C5  POST {{base_url}}/stock-movements   (admin_token)
{ "product_variant_id": M_ID, "type": "in", "quantity": 10, "note": "Supplier delivery" }

// C7  POST {{base_url}}/stock-movements   (admin_token)
{ "product_variant_id": M_ID, "type": "adjustment", "quantity": 2, "note": "Inventory count" }
```

---

### 9.5 Scenario D — Cancellation and Order Status Lifecycle

| # | Request | Expected result |
|---|---|---|
| D1 | Create a new order (repeat A4 then A6) with quantity 3 | Stock decreased by 3 |
| D2 | `POST /orders/{{order_id}}/cancel` (customer) | 200, `status: cancelled`, `cancelled_at` set |
| D3 | `GET /products/1` | Stock is back to its previous value |
| D4 | `POST /orders/{{order_id}}/cancel` again | 422 |
| D5 | `POST /payments` on the cancelled order | 422 `Order cannot be paid while its status is cancelled.` |
| D6 | Create a new order and pay it (A6 then A8) | `paid` |
| D7 | `POST /orders/{{order_id}}/cancel` (customer) on the paid order | 422 `Only pending orders can be cancelled...` |
| D8 | `GET /admin/orders?status=paid` (admin) | The order is listed with `user` and `payment` |
| D9 | `PATCH /admin/orders/{{order_id}}/status` with `processing` | 200 |
| D10 | Same order with `completed` | 422 `Cannot change order status from processing to completed.` |
| D11 | `shipped`, then `completed` | 200 both times |
| D12 | `cancelled` on the completed order | 422 |

**Alternative to D11–D12:** take another paid order and send `cancelled` as admin. Expected: 200, stock restored, and `payment.status` becomes `refunded`.

```jsonc
// D9  PATCH {{base_url}}/admin/orders/{{order_id}}/status   (admin_token)
{ "status": "processing" }
```

---

### 9.6 Scenario E — Input Validation

| # | Request | Input | Expected result |
|---|---|---|---|
| E1 | `POST /orders` | `{}` with a non-empty cart | 422 with errors on `shipping_name`, `shipping_phone`, `shipping_address`, `shipping_city`, `shipping_country` |
| E2 | `POST /orders` | Empty cart | 422 `Your cart is empty.` |
| E3 | `POST /auth/register` | Email already used | 422 on `email` |
| E4 | `POST /auth/register` | Mismatched `password_confirmation` | 422 on `password` |
| E5 | `POST /payments` | `"method": "bitcoin"` | 422 on `method` |
| E6 | `POST /products` (admin) | Existing `slug` | 422 on `slug` |
| E7 | `POST /products/1/images` (admin) | form-data `image` = a PDF file | 422 (only jpg/jpeg/png/webp up to 4 MB) |

---

### 9.7 Scenario F — Order History Protection

| # | Request | Expected result |
|---|---|---|
| F1 | After A6: `DELETE /product-variants/{{variant_id}}` (admin) | 409 `Variant has been ordered and cannot be deleted...` |
| F2 | `DELETE /products/1` (admin) | 409 |
| F3 | `PUT /product-variants/{{variant_id}}` with `"is_active": false` | 200 |
| F4 | `POST /cart` with that variant | 422 `This product variant is not available.` |

```jsonc
// F3  PUT {{base_url}}/product-variants/{{variant_id}}   (admin_token)
{ "is_active": false }
```

---

### 9.8 Scenario G — Account

| # | Request | Expected result |
|---|---|---|
| G1 | `GET /auth/me` | User data including `role` |
| G2 | `PUT /auth/profile` with a new name and email | 200, `email_verified_at: null` (the new email must be verified) |
| G3 | `PUT /auth/change-password` with a wrong `current_password` | 422 |
| G4 | `PUT /auth/change-password` with valid data | 200 |
| G5 | `POST /auth/logout` | 200 |
| G6 | `GET /auth/me` with the same token | 401 |

```jsonc
// G2  PUT {{base_url}}/auth/profile
{ "name": "New Name", "email": "new@example.com" }

// G4  PUT {{base_url}}/auth/change-password
{ "current_password": "password", "password": "NewPassword123!", "password_confirmation": "NewPassword123!" }
```

---

## 10. Known Limitations

These are real limits of the current code and are worth stating openly when presenting the project:

- **Payment is simulated (development stage):** `POST /payments` records the payment as `paid` directly, without a real gateway such as Stripe or PayPal. The `refunded` status on cancellation is a record only; no money is actually returned.
- **Slow payments locally:** with the default `MAIL_QUEUE_CONNECTION=sync`, the invoice PDF and SMTP send happen inside the payment request (about 8–18 s with Gmail). On a server, switch to `database` with a queue worker (see section 8).
- **Verification email is still sent inline:** a verification email failure on `register` returns `500` even though the user was created.
- **Apache in XAMPP runs PHP 8.2**, while the project requires PHP 8.3, so locally the API runs only through `php artisan serve`.
- **No shipping cost, taxes or coupons:** `total` always equals `subtotal`.
- **`PUT /inventories/{id}`** changes the quantity without logging a movement. Use `stock-movements` for traceability.
- **`forgot-password`** rejects unknown emails with `422`, which reveals whether an email is registered (user enumeration). Throttling mitigates this but does not remove it.
- **`lockForUpdate` locks** work on MySQL. SQLite, used by the tests, ignores them, so real concurrency must be tested on MySQL.

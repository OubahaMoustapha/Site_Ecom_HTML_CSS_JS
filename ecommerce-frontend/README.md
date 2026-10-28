# Durra (دُرّة) — storefront and admin

React 19 + TypeScript single-page app for the Durra store. It consumes the Laravel API in `../ecommerce-api` (see its `API_DOCUMENTATION.md`) and adds no backend of its own.

- **Storefront:** four "worlds" (electronics, fashion, food, books) with their own look, product pages, search with category / brand / price filters, wishlist, cart, checkout, account and order history.
- **Admin** (`/admin`, administrators only): dashboard, orders (details and status changes), products (details, photos, variants and stock), categories, brands, attributes and values, inventory movements.
- **Arabic and English** (RTL/LTR) and four display modes (day, dark, men, women), remembered per browser.

## Run locally

```bash
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:8000/api" > .env   # the running API
npm run dev                                                 # http://localhost:5173
```

The API must be running (`php artisan serve` in `ecommerce-api`). Locally it accepts requests from any `localhost` port.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the built `dist/` locally |

## End-to-end checks

Two journeys run in a real (headless) Chrome against the running API and dev server, and clean up after themselves:

```bash
npm run test:e2e          # shop.e2e.mjs (customer) then admin.e2e.mjs (catalogue management)
```

| Variable | Default | Purpose |
|---|---|---|
| `E2E_ORIGIN` | `http://localhost:5173` | Storefront URL |
| `E2E_API` | `http://127.0.0.1:8000/api` | API URL |
| `E2E_API_DIR` | `../ecommerce-api` | Used to generate the signed e-mail verification link (`php artisan tinker`) |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@demo.test` / `password` | An administrator account |
| `E2E_EMAIL` | `e2e-{run}@example.com` | Address pattern for the test customer (verification and invoice e-mails go there) |
| `CHROME_PATH` | auto-detected | Chrome or Chromium executable |

Run them on a development database only: they create (then cancel or delete) accounts, orders and products.

## Code map

| Folder | Contents |
|---|---|
| `src/services/` | One module per API area (`productService`, `shopService`, `authService`, `adminService`, `catalogService`) on top of `apiClient` |
| `src/context/` | Preferences (language, mode), auth session, cart, wishlist, worlds |
| `src/pages/` | Store pages; `src/pages/admin/` admin pages (loaded on demand) |
| `src/components/` | Shared UI (cards, fields, layout, admin widgets) |
| `src/i18n/dictionaries.ts` | All UI strings, Arabic and English (the English table is type-checked against the Arabic keys) |
| `src/config/store.ts` | Business facts: company, contact, delivery window, return period, warranty |
| `src/content/info.ts` | About, contact, returns, payment, terms and privacy pages (`/info/…`) |
| `e2e/` | End-to-end checks (see above) |
| `src/styles/` | Design tokens per mode, base, store, world and admin styles |

## Deploying

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md): build with `VITE_API_BASE_URL` pointing at the production API and upload `dist/` (an Apache `.htaccess` is included).

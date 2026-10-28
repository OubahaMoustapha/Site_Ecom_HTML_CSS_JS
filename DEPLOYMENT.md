# Deploying Durra (دُرّة)

Durra is two applications that are deployed separately:

| Part | Folder | What it is | Served as |
|---|---|---|---|
| API | `ecommerce-api/` | Laravel 13 (PHP 8.3), MySQL, Sanctum bearer tokens | PHP-FPM behind Nginx or Apache, e.g. `https://api.example.com` |
| Storefront + admin | `ecommerce-frontend/` | React 19 single-page app (Vite build) | Static files, e.g. `https://example.com` |

The storefront talks to the API over HTTPS with `Authorization: Bearer …`. No cookies are shared, so the two can live on different domains.

---

## 1. Server requirements

- PHP **8.3** with extensions: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `zip`; **OPcache enabled**.
- MySQL 8 or MariaDB 10.6+.
- Composer 2, and Node.js 20+ (only where the frontend is built).
- A process manager for the queue worker (Supervisor or systemd) and cron.
- HTTPS certificates for both domains.

---

## 2. API (`ecommerce-api`)

### 2.1 Install

```bash
cd ecommerce-api
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

### 2.2 Production `.env`

| Key | Production value | Why |
|---|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` | With debug on, errors expose SQL and stack traces |
| `APP_URL` | `https://api.example.com` | Builds product image URLs and email verification links |
| `FRONTEND_URL` | `https://example.com` | Password-reset links and the post-verification redirect |
| `CORS_ALLOWED_ORIGINS` | `https://example.com` (comma-separated if several) | Only these origins may call the API from a browser (defaults to `FRONTEND_URL`) |
| `DB_*` | your database | |
| `MAIL_*` | a real SMTP provider | Verification, password reset and invoice emails |
| `MAIL_QUEUE_CONNECTION` / `QUEUE_CONNECTION` | `database` / `database` | Emails are sent by the worker, never inside a customer's request |
| `MAIL_TIMEOUT` | `10` | Seconds per SMTP operation |
| `SANCTUM_EXPIRATION` | `10080` (7 days) or your policy | Login tokens expire |

Locally (`APP_ENV=local`) the API accepts any `localhost` port as origin; in production only the origins above are accepted.

### 2.3 Database — do **not** run `db:seed`

```bash
php artisan migrate --force
php artisan storage:link
```

> `php artisan db:seed` creates **demo accounts with the password `password`** (including an administrator) and demo products. Never run it, nor `DemoDataSeeder` / `WorldsSeeder`, on a production database.

Create the first administrator by registering on the storefront, then:

```bash
php artisan user:make-admin owner@example.com
```

### 2.4 Optimise and set permissions

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache
```

Run the three `cache` commands again after every deploy or `.env` change.

### 2.5 Queue worker and scheduler

Supervisor program (one worker is enough to start):

```ini
[program:durra-worker]
command=php /var/www/ecommerce-api/artisan queue:work --sleep=3 --tries=3 --max-time=3600
user=www-data
autostart=true
autorestart=true
stopwaitsecs=3600
```

Cron (prunes expired login tokens daily):

```cron
* * * * * cd /var/www/ecommerce-api && php artisan schedule:run >> /dev/null 2>&1
```

After each deploy: `php artisan queue:restart`.

### 2.6 Web server (Nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    root /var/www/ecommerce-api/public;
    index index.php;
    client_max_body_size 8M;          # product photos are limited to 4 MB each

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }
}
```

The API itself sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a restrictive `Content-Security-Policy` on every response.

### 2.7 Email delivery

Do not send from a personal Gmail account in production (daily sending limits, messages flagged as spam). Use a transactional provider (Brevo, Mailgun, Postmark, Amazon SES…) with an address on your own domain:

- `MAIL_MAILER=smtp`, `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` from the provider, `MAIL_FROM_ADDRESS=no-reply@example.com`.
- Publish the provider's **SPF** and **DKIM** DNS records, plus a **DMARC** record, so verification, password-reset and invoice emails reach the inbox.
- Invoice emails go through the queue (`MAIL_QUEUE_CONNECTION=database`). Verification and password-reset emails are sent during the request itself, so a reliable provider also keeps sign-up fast.

### 2.8 Backups and monitoring

```cron
# Daily database dump, kept 14 days
30 2 * * * mysqldump --single-transaction -u durra -p'…' durra | gzip > /backups/db-$(date +\%F).sql.gz && find /backups -name 'db-*.sql.gz' -mtime +14 -delete
# Uploaded product photos
45 2 * * * tar -czf /backups/storage-$(date +\%F).tar.gz -C /var/www/ecommerce-api storage/app/public && find /backups -name 'storage-*.tar.gz' -mtime +14 -delete
```

Copy `/backups` off the server (object storage or another machine), and test a restore once.

- Logs: set `LOG_CHANNEL=daily` and `LOG_LEVEL=warning`; logs rotate in `storage/logs/`.
- Uptime: point a monitor (UptimeRobot, Better Stack…) at `https://api.example.com/up` and at the storefront home page.
- Errors: optionally add an error tracker (Sentry, Flare) to be alerted of exceptions instead of reading logs.

---

## 3. Storefront and admin (`ecommerce-frontend`)

### 3.0 Store details and legal pages (before building)

Edit `ecommerce-frontend/src/config/store.ts` **before building**. It holds the company name and registration (RC / ICE), address, email, phone, WhatsApp, support hours, delivery window, return period and warranty. The top bar, home page, world banners and the pages under `/info/…` (about, contact, returns, payment, terms, privacy) all read from it.

The terms and privacy texts in `src/content/info.ts` are a starting template written for Morocco (laws 31-08 and 09-08). Have them reviewed for your company, and declare the processing of customer data to the CNDP if required.

### 3.1 Build

```bash
cd ecommerce-frontend
cp .env.production.example .env.production   # then set the real API URL
npm ci
npm run build                                # output: dist/
```

`.env.production` only needs `VITE_API_BASE_URL=https://api.example.com/api`. It is compiled into the bundle (it is public by nature) and ignored by Git.

### 3.2 Upload

Upload the **contents** of `dist/` to the web root of `example.com`.

- **Apache:** `dist/.htaccess` is included. It sends every unknown path to `index.html` (client-side routes such as `/product/12` or `/admin`), caches hashed assets for a year and keeps `index.html` fresh. Requires `mod_rewrite` (`mod_headers` recommended).
- **Nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    root /var/www/durra-frontend;
    index index.html;

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files $uri /index.html;
    }
}
```

`robots.txt` keeps `/admin`, `/account`, `/cart` and `/checkout` out of search engines.

---

## 4. First-run setup (admin panel)

The storefront is organised in four **worlds**. Each world is a top-level category with a fixed slug. In **Admin → Catalogue setup → Categories**, create:

| World | Slug (exact) |
|---|---|
| Electronics | `world-electronics` |
| Fashion | `world-fashion` |
| Food | `world-food` |
| Books & school | `world-books` |

Then create sub-categories with one of these worlds as parent, brands, and attributes with their values (size, colour, weight…). Add products in **Admin → Products**: details first, then photos and variants (each variant has its own SKU, price and stock).

---

## 5. Smoke test after deploying

1. `https://api.example.com/up` answers 200.
2. The home page loads products; a world page and a product page open by direct URL (refresh works).
3. Register → the verification email arrives → the link opens the account page with a confirmation message.
4. Add to cart → checkout → the order page shows "paid" → the invoice email arrives (queue worker running).
5. Log in as the administrator → move the order to "processing" → stock and dashboard reflect it.

---

## 6. Demo photos

The demo products in the development database use photos from Wikimedia Commons under CC0 / CC BY / CC BY-SA licences. They are not part of the code and do not reach production. If you reuse any of them, credit the author as listed in [`docs/demo-photo-credits.md`](docs/demo-photo-credits.md).

## 7. Before taking real money

**Payments are simulated** (development stage): `POST /payments` marks the order as paid without contacting a gateway. Integrate a real provider (e.g. CMI, Stripe, PayPal) before accepting real payments.

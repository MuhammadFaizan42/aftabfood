# Production Offline = Localhost (Hostinger / Live)

Offline mode uses **IndexedDB** and **Service Worker** the same way on localhost and on live (e.g. Hostinger). There is no different code path for production.

## What runs everywhere (localhost + live)

- **IndexedDB** (`aftabfood-offline`): customers, products, customer dashboards, existing orders, offline cart, visits, meta.
- **Service Worker** (`/sw.js`): caches pages and `_next` assets when you visit them online; serves from cache when offline.
- **Bootstrap**: when the app is **online**, it fills IndexedDB (products, customers, dashboards, existing orders). It also runs again when you bring the tab back to focus or when the tab becomes visible and the device is online.
- **Route warm-up**: when the app loads **online**, after a short delay it silently loads critical routes (/, /new-order, /dashboard, /products) in the background so the SW caches their HTML + JS chunks. That way offline on deployment works like localhost. Warm-up runs at most once per 24 hours.

So: **same DB name, same SW logic, same bootstrap, same warm-up** on both environments.

## Checklist so live behaves like localhost

### 1. Build with correct API URL (Hostinger / production)

- Set **`NEXT_PUBLIC_API_BASE_URL`** to your real API base (e.g. `https://api.otwoostores.com/restful`) in the **build** environment (Hostinger env vars or `.env.production`).
- Next.js injects this at **build time**. If it’s wrong or missing, API calls on live will fail and bootstrap won’t fill IndexedDB properly.

### 2. One-time online visit on the live URL

- Open your **live site** (e.g. `https://yoursite.com`) **once while online**.
- The app **automatically warms up** critical routes (/, /new-order, /dashboard, /products) in the background after ~4 seconds. That caches each page’s HTML and JS chunks so they work offline. Warm-up runs at most **once per 24 hours** so it doesn’t slow every visit.
- For **Customer dashboard**, open it once from the customer list (select a customer) so that route is cached too. After that, offline = localhost for these routes.

### 3. No localhost-only logic

- The app does **not** check for `localhost` or different origins for offline. IndexedDB and SW are per-origin, so on live you get a separate cache for that domain, but the **behavior** is the same.

## If offline on live still doesn’t match localhost

- Confirm **1** and **2** above (correct `NEXT_PUBLIC_API_BASE_URL` at build, and at least one full online visit on live including customer list + dashboard).
- Clear site data / cache for the live domain and repeat the online visit, then test offline again.
- Ensure the live site is **HTTPS** (required for Service Worker and IndexedDB in production).

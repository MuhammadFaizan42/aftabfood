# Deployment & Offline Mode (e.g. Hostinger)

## Offline mode on production

Offline mode caches customers, products, and customer dashboards in the browser (IndexedDB). For it to work on a deployed app (e.g. Hostinger):

1. **API URL at build time**  
   Set `NEXT_PUBLIC_API_BASE_URL` when building for production so the app can fetch and cache data:
   - In Hostinger (or your host), set the env var to your backend API base URL (e.g. `https://api.otwoostores.com/restful` or your own API).
   - Next.js bakes this into the client at **build time**, so rebuild after changing it.

2. **Open the app once when online**  
   On the first visit (or after clearing site data), the app must be **online** so it can run “bootstrap” and fill the cache (customers, products, dashboards). After that, offline mode will show cached data.

3. **If you see “Offline” and nothing loads**  
   - Make sure you opened the app at least once when online on that device/URL.  
   - Ensure `NEXT_PUBLIC_API_BASE_URL` was set correctly when you built the app for production.

The app now also:
- Caches data **per step** (if products fail but customers succeed, customers are still cached).
- Shows **cached data** when the server is unreachable (e.g. wrong API URL or network issue), with a message that data is from cache.

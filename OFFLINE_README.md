# Offline-First Implementation

The app has been converted to work offline for the field sales team.

## How It Works

### When Online
- **Master data** (products, customers) is fetched from the API and cached in IndexedDB
- Customer dashboard data is cached when a customer is visited
- Cache is refreshed every 1 hour or when coming back online

### When Offline
- **Products** – Browse from cached data
- **Customers** – Select from cached list (Create New Customer requires internet)
- **Customer Dashboard** – View if previously visited when online
- **Orders** – Add products to cart, review, and submit
- Orders are stored locally with `sync_status: "pending"` and a unique UUID
- Data survives browser close/reopen

### When Back Online
- Connectivity is detected automatically
- Pending orders are synced to `POST /api/sales/sync-orders`
- Synced orders are removed from the local queue
- Master data is refreshed

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/idb.js` | IndexedDB wrapper (products, customers, dashboards, orders) |
| `src/lib/offline/orderQueue.js` | Offline order queue with UUID, sync_status |
| `src/lib/offline/syncManager.js` | Sync pending orders when online |
| `src/lib/offline/bootstrapLoader.js` | Load and cache master data |
| `src/lib/offline/offlineCart.js` | Local cart when offline |
| `src/lib/offline/useOnlineStatus.js` | `useOnlineStatus()` hook |
| `src/app/api/sales/sync-orders/route.js` | Batch sync API endpoint |
| `public/sw.js` | Service Worker for offline page caching |

## Sync API

**POST /api/sales/sync-orders**

- Header: `Authorization: Bearer <token>`
- Body: `{ orders: [{ uuid, customer_id, items, delivery_date?, pay_terms?, discount?, remarks? }] }`
- Items: `[{ item_id, qty, unit_price, uom?, comments? }]`
- Response: `{ results: [{ uuid, success, order_id? }] }`
- Each order is created via existing `add_to_cart` + `submit_order` APIs

## Usage

1. **First run (online)**: App bootstraps products + customers into IndexedDB
2. **Offline**: Use products, select customers, create orders – all stored locally
3. **Back online**: Pending orders sync automatically; header shows "Offline mode" when disconnected

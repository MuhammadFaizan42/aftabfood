# Offline Storage – Same on Localhost & Deployment (Hostinger)

Deployment pe bhi **IndexedDB** aur **Local Storage** bilkul waisa hi use hota hai jaisa localhost pe. Code me koi `localhost` / `production` check nahi hai.

---

## 1. IndexedDB (same on both)

- **DB name:** `aftabfood-offline`
- **Stores:** products, customers, customerDashboards, existingOrders, orderDetails, offlineCart, meta, visits, visitHistoryCache
- **Use:** bootstrapLoader (customers, products, dashboards, existing orders), offlineCart (cart backup), review/cart (cached order detail), existing-orders (offline orders), sync (backend_trns_id)
- **Kahan:** `src/lib/idb.js`, `src/lib/offline/bootstrapLoader.js`, `src/lib/offline/offlineCart.js`, etc.

Yeh sab **localhost aur Hostinger dono** pe same file se chal raha hai – koi env-based switch nahi.

---

## 2. Local Storage (same on both)

- **Auth:** `auth_token`, `auth_user` (`src/lib/api.js`)
- **Cart:** `sale_order_trns_id` (`src/lib/api.js`)
- **Offline cart backup:** `aftab_offline_cart` (`src/lib/offline/offlineCart.js`)
- **Profile image:** `profileImage` (Header)
- **PWA dismiss:** `pwa_install_dismissed` (PWAInstallPrompt)

Yeh bhi **dono environments** me same keys, same logic.

---

## 3. Session Storage (same on both)

- **Party code:** `sale_order_party_code` (`src/lib/api.js`)

---

## 4. Service Worker + Cache – kyun use ho raha hai?

**IndexedDB / Local Storage** app **ke andar** data ke liye use hote hain (customers, products, cart, auth).  
**Service Worker + Cache** is liye use hota hai taake **app khud load ho sake** jab network nahi hota.

- Offline pe browser ko **pehle** HTML + JS chunks chahiye (e.g. `/new-order` ka page).
- Network fail hone pe yeh sirf **cache** se aa sakte hain – isi ke liye SW request intercept karke cached document/chunks serve karta hai.
- **Jab tak app load nahi hoti**, tab tak IndexedDB / Local Storage wala code chal hi nahi sakta.

Isliye:

- **SW + Cache** = app ko offline load karna (localhost + deployment dono pe same).
- **IndexedDB + Local Storage** = app ke andar data (localhost + deployment dono pe same).

Deployment pe "cached document serve" isliye hai taake offline pe bhi app open ho, phir wahi IndexedDB/Local Storage use ho jaisa localhost pe.

---

## Short

- Deployment pe **IndexedDB aur Local Storage** localhost jaisa hi use ho rahe hain – same code, same keys, no env check.
- **Cached document (SW)** sirf app ko load karne ke liye hai; data wala logic dono jagah IndexedDB + Local Storage pe hi hai.

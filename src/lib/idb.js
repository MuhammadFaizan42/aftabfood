/**
 * IndexedDB utility layer using idb
 * Stores: products, customers, customerDashboards, orders, existingOrders, orderDetails, meta
 */
import { openDB } from "idb";

const DB_NAME = "aftabfood-offline";
const DB_VERSION = 6;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVer, newVer) {
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "PK_ID" });
      }
      if (!db.objectStoreNames.contains("customerDashboards")) {
        db.createObjectStore("customerDashboards", { keyPath: "party_code" });
      }
      if (!db.objectStoreNames.contains("orders")) {
        const orderStore = db.createObjectStore("orders", { keyPath: "uuid" });
        orderStore.createIndex("sync_status", "sync_status", { unique: false });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      if (newVer >= 2) {
        if (!db.objectStoreNames.contains("existingOrders")) {
          db.createObjectStore("existingOrders", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("orderDetails")) {
          db.createObjectStore("orderDetails", { keyPath: "trns_id" });
        }
      }
      if (newVer >= 3) {
        if (!db.objectStoreNames.contains("offlineCart")) {
          db.createObjectStore("offlineCart", { keyPath: "id" });
        }
      }
      if (newVer >= 4 && !db.objectStoreNames.contains("visits")) {
        const visitStore = db.createObjectStore("visits", { keyPath: "id" });
        visitStore.createIndex("visit_date", "visit_date", { unique: false });
      }
      if (newVer >= 6 && !db.objectStoreNames.contains("visitHistoryCache")) {
        db.createObjectStore("visitHistoryCache", { keyPath: "party_code" });
      }
    },
  });
}

/** Put many records into a store (clear + bulk add) */
export async function putMany(storeName, items) {
  const db = await getDB();
  const tx = db.transaction(storeName, "readwrite");
  await tx.store.clear();
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

/** Add/merge many records without clearing (upsert) */
export async function putManyMerge(storeName, items, keyPath = "id") {
  if (!items?.length) return;
  const db = await getDB();
  const tx = db.transaction(storeName, "readwrite");
  for (const item of items) {
    const key = item[keyPath] ?? item.id ?? item.trns_id ?? item.PK_ID;
    if (key != null) await tx.store.put({ ...item, [keyPath]: key });
  }
  await tx.done;
}

/** Put one record */
export async function putOne(storeName, item) {
  const db = await getDB();
  await db.put(storeName, item);
}

/** Get all from store */
export async function getAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

/** Get by key */
export async function getByKey(storeName, key) {
  const db = await getDB();
  return db.get(storeName, key);
}

/** Delete by key */
export async function deleteByKey(storeName, key) {
  const db = await getDB();
  return db.delete(storeName, key);
}

/** Get meta value */
export async function getMeta(key) {
  const row = await getByKey("meta", key);
  return row?.value;
}

/** Set meta value */
export async function setMeta(key, value) {
  await putOne("meta", { key, value });
}

/**
 * Offline cart – IndexedDB meta store + localStorage (sync backup for same-tab)
 * Read: localStorage first (sync), then IndexedDB. Write: both.
 */
import { getMeta, setMeta } from "../idb";

const CART_KEY = "offline_cart";
const LOCAL_STORAGE_KEY = "aftab_offline_cart";

function emptyCart() {
  return { customer_id: null, items: [], updatedAt: 0 };
}

function normalizeCart(raw) {
  if (!raw) return emptyCart();
  const items = Array.isArray(raw.items) ? raw.items : (raw.items ? [] : []);
  return {
    customer_id: raw.customer_id ?? null,
    items,
    updatedAt: raw.updatedAt ?? 0,
  };
}

function readFromLocalStorage() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return normalizeCart(parsed);
    }
  } catch {
    // ignore
  }
  return null;
}

function writeToLocalStorage(data) {
  if (typeof localStorage === "undefined") return;
  try {
    const payload = {
      customer_id: data.customer_id ?? null,
      items: Array.isArray(data.items) ? data.items : [],
      updatedAt: Date.now(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearLocalStorageCart() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Sync read from localStorage only – use for immediate UI when offline */
export function getOfflineCartSync() {
  return readFromLocalStorage();
}

/** Get offline cart – localStorage first (sync), then IndexedDB */
export async function getOfflineCart() {
  const fromLocal = readFromLocalStorage();
  if (fromLocal && fromLocal.items.length > 0) return fromLocal;
  try {
    const raw = await getMeta(CART_KEY);
    const cart = normalizeCart(raw);
    if (cart.items.length > 0) {
      writeToLocalStorage(cart);
      return cart;
    }
  } catch {
    // ignore
  }
  return emptyCart();
}

/** Save offline cart – write to both localStorage (sync) and IndexedDB */
async function saveOfflineCart(data) {
  const payload = {
    customer_id: data.customer_id ?? null,
    items: Array.isArray(data.items) ? data.items : [],
    updatedAt: Date.now(),
  };
  writeToLocalStorage(payload);
  try {
    await setMeta(CART_KEY, payload);
  } catch {
    // localStorage already written
  }
}

/** Set offline cart */
export async function setOfflineCart(customerId, items) {
  const data = {
    customer_id: customerId || null,
    items: Array.isArray(items) ? items : [],
    updatedAt: Date.now(),
  };
  await saveOfflineCart(data);
}

/** Add item to offline cart */
export async function addToOfflineCart(customerId, item) {
  const cart = await getOfflineCart();
  if (cart.customer_id && cart.customer_id !== customerId) {
    cart.items = [];
  }
  cart.customer_id = customerId;
  const itemKey = String(item.item_id ?? item.product_id ?? "");
  const existing = cart.items.find(
    (i) => String(i.item_id ?? i.product_id) === itemKey
  );
  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + (Number(item.qty) || 0);
  } else {
    cart.items.push({
      item_id: item.item_id ?? item.product_id,
      product_id: item.product_id ?? item.item_id,
      product_key: item.product_key ?? item.item_id ?? item.product_id,
      qty: Number(item.qty) || 0,
      unit_price: Number(item.unit_price) || 0,
      uom: item.uom || "",
      comments: item.comments || "",
      product_name: item.product_name,
      sku: item.sku,
    });
  }
  await saveOfflineCart(cart);
  return cart;
}

/** Update item qty in offline cart */
export async function updateOfflineCartItem(itemId, qty) {
  const cart = await getOfflineCart();
  const idx = cart.items.findIndex(
    (i) => String(i.item_id ?? i.product_id) === String(itemId)
  );
  if (idx < 0) return cart;
  if (qty <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].qty = qty;
  }
  await saveOfflineCart(cart);
  return cart;
}

/** Remove item from offline cart */
export async function removeFromOfflineCart(itemId) {
  return updateOfflineCartItem(itemId, 0);
}

/** Clear offline cart (after order submitted/synced) */
export async function clearOfflineCart() {
  clearLocalStorageCart();
  try {
    await setMeta(CART_KEY, emptyCart());
  } catch {
    // ignore
  }
}

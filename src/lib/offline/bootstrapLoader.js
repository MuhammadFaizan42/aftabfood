/**
 * Bootstrap loader – fetch master data when online and store in IndexedDB
 */
import { putMany, putOne, putManyMerge, getAll, getByKey, deleteByKey, setMeta, getMeta } from "../idb";
import { getProducts, getCustomers, getPartySaleInvDashboard, getExistingOrders } from "@/services/shetApi";

const META_LAST_SYNC = "master_last_sync";
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour – refresh cache

const PRODUCTS_LIMIT = 2000;
const CUSTOMERS_LIMIT = 2000;
const DASHBOARD_BATCH_SIZE = 8;

/** Check if cache is stale */
async function isCacheStale() {
  const last = await getMeta(META_LAST_SYNC);
  if (!last) return true;
  return Date.now() - last > SYNC_INTERVAL_MS;
}

/** Load products from API and store – fetch in pages until we have up to PRODUCTS_LIMIT */
async function loadProducts() {
  const PAGE_SIZE = 500;
  let all = [];
  let offset = 0;
  for (;;) {
    const res = await getProducts({ limit: PAGE_SIZE, offset });
    if (!res?.success || !Array.isArray(res.data) || res.data.length === 0) break;
    all = all.concat(res.data);
    if (res.data.length < PAGE_SIZE || all.length >= PRODUCTS_LIMIT) break;
    offset += PAGE_SIZE;
  }
  if (!all.length) return;
  const items = all.slice(0, PRODUCTS_LIMIT).map((p) => ({
    ...p,
    id: p.PK_INV_ID ?? p.PK_ID ?? p.PRODUCT_ID ?? p.id ?? p.SKU ?? String(Math.random()),
  }));
  await putMany("products", items);
}

/** Load customers from API and store – fetch in pages until we have up to CUSTOMERS_LIMIT */
async function loadCustomers() {
  const PAGE_SIZE = 200;
  let all = [];
  let offset = 0;
  for (;;) {
    const res = await getCustomers({ limit: PAGE_SIZE, offset });
    if (!res?.success || !Array.isArray(res.data) || res.data.length === 0) break;
    all = all.concat(res.data);
    if (res.data.length < PAGE_SIZE || all.length >= CUSTOMERS_LIMIT) break;
    offset += PAGE_SIZE;
  }
  if (!all.length) return;
  const items = all.slice(0, CUSTOMERS_LIMIT).map((c) => ({
    ...c,
    PK_ID: c.PK_ID ?? c.CUSTOMER_ID ?? c.id ?? c.SHORT_CODE ?? String(Math.random()),
  }));
  await putMany("customers", items);
}

/** Update customers cache (call when fetching fresh from API) */
export async function cacheCustomers(customers) {
  if (!Array.isArray(customers) || !customers.length) return;
  const items = customers.map((c) => ({
    ...c,
    PK_ID: c.PK_ID ?? c.CUSTOMER_ID ?? c.id ?? c.SHORT_CODE ?? String(Math.random()),
  }));
  await putMany("customers", items);
}

/** Load and cache a single customer dashboard */
export async function loadCustomerDashboard(partyCode) {
  const res = await getPartySaleInvDashboard(partyCode);
  if (!res?.success || !res?.data) return null;
  await putOne("customerDashboards", {
    party_code: String(partyCode),
    data: res.data,
    updatedAt: Date.now(),
  });
  return res.data;
}

/** Preload ALL customer dashboards for full offline – load in batches */
async function loadCustomerDashboards() {
  const customers = await getAll("customers");
  const partyCodes = [...new Set(
    customers
      .map((c) => c.SHORT_CODE ?? c.CUSTOMER_ID ?? c.PARTY_CODE ?? c.code ?? c.CUSTOMER_CODE)
      .filter(Boolean)
  )];
  for (let i = 0; i < partyCodes.length; i += DASHBOARD_BATCH_SIZE) {
    const batch = partyCodes.slice(i, i + DASHBOARD_BATCH_SIZE);
    await Promise.all(
      batch.map((code) =>
        loadCustomerDashboard(code).catch(() => null)
      )
    );
  }
}

/** Load existing orders into cache (default: last 3 months) */
async function loadExistingOrders() {
  try {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    const res = await getExistingOrders({
      from_date: from.toISOString().slice(0, 10),
      to_date: to.toISOString().slice(0, 10),
    });
    const raw = res?.data?.orders ?? res?.data?.list ?? res?.data?.items ?? (Array.isArray(res?.data) ? res.data : []);
    if (!raw.length) return;
    const items = raw.map((r, i) => {
      const id = r.trns_id ?? r.TRNS_ID ?? r.order_id ?? r.ORDER_ID ?? r.id ?? i;
      const orderDate = r.order_date ?? r.ORDER_DATE ?? r.created_at ?? r.date ?? r.trns_date ?? "";
      return {
        id: String(id),
        ...r,
        order_date: orderDate,
        _orderDateStr: typeof orderDate === "string" ? orderDate.slice(0, 10) : "",
      };
    });
    await putManyMerge("existingOrders", items, "id");
  } catch {
    // ignore
  }
}

/** Full bootstrap – products + customers + dashboards + existing orders. Runs each step independently so partial cache works when some API calls fail (e.g. on production/Hostinger). */
export async function bootstrapMasterData(force = false) {
  if (typeof window === "undefined") return;
  const stale = await isCacheStale();
  if (!stale && !force) return;

  const now = Date.now();
  await loadProducts().catch((err) => {
    console.warn("[offline] Bootstrap products failed:", err?.message);
  });
  await loadCustomers().catch((err) => {
    console.warn("[offline] Bootstrap customers failed:", err?.message);
  });
  await loadCustomerDashboards().catch((err) => {
    console.warn("[offline] Bootstrap dashboards failed:", err?.message);
  });
  await loadExistingOrders().catch((err) => {
    console.warn("[offline] Bootstrap existing orders failed:", err?.message);
  });
  await setMeta(META_LAST_SYNC, now).catch(() => {});
}

/** Get products from cache (IndexedDB) */
export async function getCachedProducts(params = {}) {
  const all = await getAll("products");
  let list = all;
  const { category, search } = params || {};
  if (category && category !== "All Items") {
    list = list.filter((p) => (p.CATEGORY ?? p.category ?? "").toLowerCase() === category.toLowerCase());
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.PRODUCT_NAME ?? p.ITEM_NAME ?? p.name ?? "").toLowerCase().includes(s) ||
        (p.PRODUCT_ID ?? p.SKU ?? p.CODE ?? "").toLowerCase().includes(s)
    );
  }
  return list;
}

/** Get customers from cache */
export async function getCachedCustomers() {
  return getAll("customers");
}

/** Get customer dashboard from cache */
export async function getCachedCustomerDashboard(partyCode) {
  const row = await getByKey("customerDashboards", String(partyCode));
  return row?.data ?? null;
}

/** Cache customer dashboard data (call after fetching when online) */
export async function cacheCustomerDashboard(partyCode, data) {
  if (!partyCode || !data) return;
  await putOne("customerDashboards", {
    party_code: String(partyCode),
    data,
    updatedAt: Date.now(),
  });
}

/** Cache existing orders (call after fetching when online) */
export async function cacheExistingOrders(apiResponse) {
  const raw = apiResponse?.data?.orders ?? apiResponse?.data?.list ?? apiResponse?.data?.items ?? (Array.isArray(apiResponse?.data) ? apiResponse.data : []);
  if (!raw.length) return;
  const items = raw.map((r, i) => {
    const id = r.trns_id ?? r.TRNS_ID ?? r.order_id ?? r.ORDER_ID ?? r.id ?? i;
    const orderDate = r.order_date ?? r.ORDER_DATE ?? r.created_at ?? r.date ?? r.trns_date ?? "";
    return {
      id: String(id),
      ...r,
      order_date: orderDate,
      _orderDateStr: typeof orderDate === "string" ? orderDate.slice(0, 10) : "",
    };
  });
  await putManyMerge("existingOrders", items, "id");
}

/** Get cached existing orders filtered by date range */
export async function getCachedExistingOrders(fromDate, toDate) {
  const all = await getAll("existingOrders");
  if (!fromDate && !toDate) return all;
  const from = fromDate ? String(fromDate).slice(0, 10) : "";
  const to = toDate ? String(toDate).slice(0, 10) : "";
  return all.filter((o) => {
    const d = o._orderDateStr ?? o.order_date ?? o.ORDER_DATE ?? "";
    const dStr = typeof d === "string" ? d.slice(0, 10) : "";
    if (from && dStr < from) return false;
    if (to && dStr > to) return false;
    return true;
  });
}

/** Cache order detail (getOrderReview response) for offline View */
export async function cacheOrderDetail(trnsId, reviewData) {
  if (!trnsId || !reviewData) return;
  await putOne("orderDetails", {
    trns_id: String(trnsId),
    data: reviewData,
    updatedAt: Date.now(),
  });
}

/** Get cached order detail for offline View */
export async function getCachedOrderDetail(trnsId) {
  const row = await getByKey("orderDetails", String(trnsId));
  return row?.data ?? null;
}

const OFFLINE_ORDER_ID_PREFIX = "offline_";
const OFFLINE_ORDERS_MAX = 50;

/** Generate unique id for a new offline order */
export function generateOfflineOrderId() {
  return `${OFFLINE_ORDER_ID_PREFIX}${Date.now()}`;
}

/**
 * Save current offline cart as a new order into existingOrders + orderDetails.
 * Full order + line items stored (same shape as online). Max 50 offline orders; oldest dropped.
 * Optional: orderId (use this to avoid double entry when caller already set cart trns id), delivery_date, pay_terms, discount, remarks for sync.
 */
export async function saveOfflineOrderToExistingOrders(payload) {
  const {
    customer,
    items,
    subtotal,
    tax,
    discount,
    grandTotal,
    customer_id,
    delivery_date,
    pay_terms,
    discount_val,
    remarks,
    orderId: providedOrderId,
  } = payload;
  const orderId = providedOrderId && String(providedOrderId).startsWith(OFFLINE_ORDER_ID_PREFIX)
    ? String(providedOrderId)
    : generateOfflineOrderId();
  const orderDate = new Date();
  const orderDateStr = orderDate.toISOString().slice(0, 10);
  const customerName =
    customer?.CUSTOMER_NAME ?? customer?.customer_name ?? customer?.name ?? "—";

  const existingOrderRow = {
    id: orderId,
    trns_id: orderId,
    order_id: orderId,
    order_date: orderDate.toISOString(),
    _orderDateStr: orderDateStr,
    ORDER_DATE: orderDate.toISOString(),
    customer_name: customerName,
    CUSTOMER_NAME: customerName,
    party_name: customerName,
    status: "Offline",
    STATUS: "Offline",
    order_status: "Offline",
    amount: grandTotal ?? 0,
    AMOUNT: grandTotal ?? 0,
    total: grandTotal ?? 0,
    grand_total: grandTotal ?? 0,
    party_code: customer_id ?? null,
    PARTY_CODE: customer_id ?? null,
    customer_id: customer_id ?? null,
    can_edit: true,
  };
  await putOne("existingOrders", existingOrderRow);

  const reviewData = {
    customer: customer ?? {},
    items: items ?? [],
    subtotal: subtotal ?? 0,
    sub_total: subtotal ?? 0,
    tax: tax ?? 0,
    discount: discount ?? 0,
    grand_total: grandTotal ?? 0,
    total: grandTotal ?? 0,
    delivery_date: delivery_date ?? "",
    pay_terms: pay_terms ?? "",
    discount_val: discount_val ?? "",
    remarks: remarks ?? "",
  };
  await putOne("orderDetails", {
    trns_id: orderId,
    data: reviewData,
    updatedAt: Date.now(),
  });

  const offlineOnly = await getOfflineOrdersFromStore();
  if (offlineOnly.length > OFFLINE_ORDERS_MAX) {
    const sorted = [...offlineOnly].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const toRemove = sorted.slice(0, offlineOnly.length - OFFLINE_ORDERS_MAX);
    for (const o of toRemove) {
      await deleteByKey("orderDetails", String(o.id));
      await deleteByKey("existingOrders", String(o.id));
    }
  }
  return orderId;
}

/** Get all offline-only orders from IndexedDB (id starts with offline_) */
export async function getOfflineOrdersFromStore() {
  const all = await getAll("existingOrders");
  return all.filter((o) => o.id && String(o.id).startsWith(OFFLINE_ORDER_ID_PREFIX));
}

/**
 * Update an offline order's items, total, and optional meta in both existingOrders and orderDetails.
 * Use when user edits cart (qty/remove) or delivery_date/pay_terms/discount/remarks for sync.
 */
export async function updateOfflineOrderInStores(trnsId, payload) {
  const { items, grandTotal, delivery_date, pay_terms, discount_val, remarks } = payload;
  if (!trnsId || !String(trnsId).startsWith(OFFLINE_ORDER_ID_PREFIX)) return;
  const row = await getByKey("orderDetails", String(trnsId));
  if (!row?.data) return;
  const updatedData = {
    ...row.data,
    items: items ?? row.data.items,
    grand_total: grandTotal ?? row.data.grand_total,
    total: grandTotal ?? row.data.grand_total,
  };
  if (delivery_date !== undefined) updatedData.delivery_date = delivery_date;
  if (pay_terms !== undefined) updatedData.pay_terms = pay_terms;
  if (discount_val !== undefined) updatedData.discount_val = discount_val;
  if (remarks !== undefined) updatedData.remarks = remarks;
  await putOne("orderDetails", { trns_id: String(trnsId), data: updatedData, updatedAt: Date.now() });
  const existingRow = await getByKey("existingOrders", String(trnsId));
  if (existingRow) {
    existingRow.amount = grandTotal ?? existingRow.amount;
    existingRow.AMOUNT = existingRow.amount;
    existingRow.total = existingRow.amount;
    existingRow.grand_total = existingRow.amount;
    await putOne("existingOrders", existingRow);
  }
}

/**
 * Remove an offline order from existingOrders and orderDetails (e.g. after submit/enqueue).
 */
export async function deleteOfflineOrder(trnsId) {
  if (!trnsId || !String(trnsId).startsWith(OFFLINE_ORDER_ID_PREFIX)) return;
  await deleteByKey("orderDetails", String(trnsId));
  await deleteByKey("existingOrders", String(trnsId));
}

/**
 * After backend sync, store backend trns_id on the offline order so Submit is allowed and UI shows synced.
 */
export async function updateOfflineOrderWithBackendTrnsId(offlineId, backendTrnsId) {
  if (!offlineId || !String(offlineId).startsWith(OFFLINE_ORDER_ID_PREFIX) || backendTrnsId == null) return;
  const row = await getByKey("existingOrders", String(offlineId));
  if (!row) return;
  row.backend_trns_id = backendTrnsId;
  row.status = "Synced";
  row.STATUS = "Synced";
  row.order_status = "Synced";
  await putOne("existingOrders", row);
}

/**
 * Get offline order row (to check backend_trns_id / sync status).
 */
export async function getExistingOrderRow(orderId) {
  if (!orderId) return null;
  return getByKey("existingOrders", String(orderId));
}

/**
 * Build payload for sync API from offline existing orders (only those without backend_trns_id yet).
 * Returns array of { uuid, customer_id, items: [{ item_id, qty, unit_price, uom?, comments? }], delivery_date?, pay_terms?, discount?, remarks? }.
 */
export async function getOfflineOrdersForSync() {
  const offline = await getOfflineOrdersFromStore();
  const pending = offline.filter((o) => o.backend_trns_id == null);
  const out = [];
  for (const order of pending) {
    const detail = await getByKey("orderDetails", String(order.id));
    const data = detail?.data;
    const customer_id = order.party_code ?? order.customer_id ?? data?.customer?.SHORT_CODE ?? data?.customer_id ?? "";
    const rawItems = data?.items ?? [];
    const items = rawItems.map((it) => ({
      item_id: String(it.item_id ?? it.id ?? it.product_id ?? it.sku ?? ""),
      qty: Number(it.qty ?? it.quantity ?? 0) || 0,
      unit_price: Number(it.unit_price ?? it.unitPrice ?? 0) || 0,
      uom: it.uom ?? "",
      comments: it.comments ?? "",
    })).filter((it) => it.item_id && it.qty > 0);
    if (!customer_id || items.length === 0) continue;
    out.push({
      uuid: order.id,
      customer_id,
      items,
      delivery_date: data?.delivery_date || undefined,
      pay_terms: data?.pay_terms || undefined,
      discount: data?.discount_val !== "" && !Number.isNaN(Number(data?.discount_val)) ? Number(data.discount_val) : undefined,
      remarks: data?.remarks || undefined,
    });
  }
  return out;
}

/** Cache visit history for a party (call when fetching from API when online). */
export async function cacheVisitHistory(partyCode, apiData) {
  if (!partyCode) return;
  const items = apiData?.items ?? apiData?.data?.items ?? (Array.isArray(apiData) ? apiData : []);
  await putOne("visitHistoryCache", {
    party_code: String(partyCode),
    items: Array.isArray(items) ? items : [],
    updatedAt: Date.now(),
  });
}

/** Get cached visit history for a party (for offline). */
export async function getCachedVisitHistory(partyCode) {
  if (!partyCode) return null;
  const row = await getByKey("visitHistoryCache", String(partyCode));
  return row?.items ?? null;
}

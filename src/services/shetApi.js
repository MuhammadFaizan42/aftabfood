/**
 * Otwoo Stores API
 * Swagger: https://api.otwoostores.com/restful/api/documentation/#/
 */

import { api } from "../lib/api";

const API_BASE = "https://api.otwoostores.com/restful";

/** Login – POST full URL use karte hain taake request hamesha API server pe jaye */
export async function login(loginId, password) {
  const res = await api.post(`${API_BASE}/models/login.php`, {
    login: loginId,
    password,
  });
  return res;
}

/** Customers list – GET customer.php (token required). Returns { success, message, data: [] } */
export async function getCustomers(params = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const url = searchParams
    ? `${API_BASE}/models/customer.php?${searchParams}`
    : `${API_BASE}/models/customer.php`;
  return api.get(url);
}

/** Customer categories for dropdown – GET customer.php?category_only=1 */
export async function getCustomerCategories() {
  const url = `${API_BASE}/models/customer.php?category_only=1`;
  return api.get(url);
}

/** Create customer – POST customer.php (token required). Body: name, postCode, town, contactPerson, mobile, category */
export async function createCustomer(payload) {
  return api.post(`${API_BASE}/models/customer.php`, payload);
}

/** Party sale invoice dashboard – GET party_sale_inv_dashboard.php?party_code=... (token required) */
export async function getPartySaleInvDashboard(partyCode, params = {}) {
  const q = new URLSearchParams({ party_code: partyCode, ...params });
  const url = `${API_BASE}/models/party_sale_inv_dashboard.php?${q.toString()}`;
  return api.get(url);
}

/** Products – GET product.php (token required). Params: category, sub_category, search, limit, offset */
export async function getProducts(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") q.set(k, String(v));
  });
  const url = q.toString()
    ? `${API_BASE}/models/product.php?${q.toString()}`
    : `${API_BASE}/models/product.php`;
  return api.get(url);
}

/** Sale returns – GET sale_return.php. Params: party_code, from_date, to_date (YYYY-MM-DD). */
export async function getSaleReturns(partyCode, params = {}) {
  const q = new URLSearchParams({ party_code: partyCode, ...params });
  const url = `${API_BASE}/models/sale_return.php?${q.toString()}`;
  return api.get(url);
}

/** Orders list */
export async function getOrders(params = {}) {
  const searchParams = new URLSearchParams(params).toString();
  const path = searchParams ? `/api/orders?${searchParams}` : "/api/orders";
  return api.get(path);
}

/** Create order */
export async function createOrder(payload) {
  return api.post("/api/orders", payload);
}

// --- Sale Order (Cart) APIs - JWT protected, same base ---
const SALE_ORDER_BASE = `${API_BASE}/models/sale_order.php`;

/** Coerce to number if numeric, else keep as-is (Oracle ORA-01722 avoid) */
function toNum(val) {
  if (val == null || val === "") return val;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}

/** Add to cart – payload: customer_id, item_id, qty, unit_price, uom, comments; trns_id optional. */
export async function addToCart(customerId, itemId, qty, trnsId = null, options = {}) {
  const body = {
    customer_id: String(customerId ?? ""),
    item_id: String(itemId ?? ""),
    qty: (Number(qty) || 0),
    unit_price: Number(options.unit_price) || 0,
  };
  const uom = String(options.uom ?? "").trim();
  const comments = String(options.comments ?? "").trim();
  if (uom) body.uom = uom;
  if (comments) body.comments = comments;
  if (trnsId != null && trnsId !== "") body.trns_id = (toNum(trnsId) ?? trnsId);
  return api.post(`${SALE_ORDER_BASE}?action=add_to_cart`, body);
}

/** Update cart item qty/rate – PUT, Swagger: trns_id, tl_id?, item_id (string), qty, rate? */
export async function updateCartItem(trnsId, itemId, qty, options = {}) {
  const body = {
    trns_id: (toNum(trnsId) ?? trnsId),
    item_id: String(itemId ?? ""),
    qty: (Number(qty) || 0),
  };
  if (options.tl_id != null) body.tl_id = (toNum(options.tl_id) ?? options.tl_id);
  if (options.rate != null) body.rate = Number(options.rate);
  return api.put(`${SALE_ORDER_BASE}?action=update_cart_item`, body);
}

/** Remove item from cart – DELETE with body (Swagger: trns_id, tl_id, item_id) */
export async function removeCartItem(trnsId, itemId, options = {}) {
  const url = `${SALE_ORDER_BASE}?action=remove_cart_item`;
  const body = {
    trns_id: toNum(trnsId) ?? trnsId,
    item_id: String(itemId ?? ""),
  };
  if (options.tl_id != null) body.tl_id = (toNum(options.tl_id) ?? options.tl_id);
  return api.delete(url, body);
}

/** Order summary for cart screen – GET with trns_id */
export async function getOrderSummary(trnsId) {
  const url = `${SALE_ORDER_BASE}?action=order_summary&trns_id=${encodeURIComponent(trnsId)}`;
  return api.get(url);
}

/** Order review before submit – GET with trns_id */
export async function getOrderReview(trnsId) {
  const url = `${SALE_ORDER_BASE}?action=order_review&trns_id=${encodeURIComponent(trnsId)}`;
  return api.get(url);
}

/** Submit order – trns_id + optional delivery_date, pay_terms, discount, remarks */
export async function submitOrder(trnsId, options = {}) {
  const body = { trns_id: trnsId, ...options };
  return api.post(`${SALE_ORDER_BASE}?action=submit_order`, body);
}

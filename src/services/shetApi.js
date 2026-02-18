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

// Swagger me jo bhi endpoints hon, unke liye yahan functions add karte jayein.
// Paths exactly wahi hon jo Swagger UI me dikhate hain.

/**
 * Otwoo Stores API Client
 * Base URL: .env.local me NEXT_PUBLIC_API_BASE_URL (optional; default below)
 */

const DEFAULT_API_BASE_URL = "https://api.otwoostores.com/restful";

const getBaseUrl = () => {
  const envUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;
  return (envUrl && envUrl.trim()) || DEFAULT_API_BASE_URL;
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const CART_TRNS_ID_KEY = "sale_order_trns_id";
const SALE_ORDER_PARTY_CODE_KEY = "sale_order_party_code";

/** Never throw — storage can throw after "clear site data", in private mode, or when disabled. */
function lsGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / disabled */
  }
}

function lsRemove(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function ssGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function ssSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function ssRemove(key) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const getAuthToken = () => {
  return lsGet(AUTH_TOKEN_KEY) || null;
};

export function setAuthToken(token, user = null) {
  if (typeof window === "undefined") return;
  if (token) lsSet(AUTH_TOKEN_KEY, token);
  if (user != null) {
    try {
      lsSet(AUTH_USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }
  if (token) {
    import("@/lib/idb").then(({ setMeta }) => setMeta("auth_token", token).catch(() => {}));
  }
}

export function clearAuthToken() {
  lsRemove(AUTH_TOKEN_KEY);
  lsRemove(AUTH_USER_KEY);
  import("@/lib/idb").then(({ deleteByKey }) => deleteByKey("meta", "auth_token").catch(() => {}));
}

/** Sale order draft – trns_id (persist across tabs) */
export function getCartTrnsId() {
  return lsGet(CART_TRNS_ID_KEY) || null;
}
export function setCartTrnsId(trnsId) {
  if (trnsId) lsSet(CART_TRNS_ID_KEY, String(trnsId));
  else lsRemove(CART_TRNS_ID_KEY);
}
export function clearCartTrnsId() {
  lsRemove(CART_TRNS_ID_KEY);
}

/** Party/customer for current sale order (session – lost on tab close) */
export function getSaleOrderPartyCode() {
  return ssGet(SALE_ORDER_PARTY_CODE_KEY) || null;
}
export function setSaleOrderPartyCode(partyCode) {
  if (partyCode) ssSet(SALE_ORDER_PARTY_CODE_KEY, String(partyCode));
  else ssRemove(SALE_ORDER_PARTY_CODE_KEY);
}

/** Logged-in user (from login response). Has LOGIN, U_ID, etc. */
export function getAuthUser() {
  try {
    const raw = lsGet(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Generic API request – Swagger ke har endpoint ke liye use kar sakte hain
 * @param {string} path - e.g. "/api/customers", "/api/orders"
 * @param {RequestInit} options - fetch options (method, body, headers)
 */
export async function apiRequest(path, options = {}) {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API Error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message || parsed.error || message;
    } catch (_) {
      if (response.status === 404 && errorBody.trimStart().startsWith("<!"))
        message = "API not reachable. Check your internet and that the API URL is correct.";
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

/**
 * Convenience methods – Swagger ke methods ke hisaab se use karein
 */
export const api = {
  get: (path) => apiRequest(path, { method: "GET" }),
  post: (path, body) =>
    apiRequest(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: (path, body) =>
    apiRequest(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) =>
    apiRequest(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: (path, body) =>
    apiRequest(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

export default api;

/**
 * Otwoo Stores API Client
 * Base URL: .env.local me NEXT_PUBLIC_API_BASE_URL (optional; default below)
 */

/** Override with NEXT_PUBLIC_API_BASE_URL / API_BASE_URL if needed (e.g. another tenant host). */
const DEFAULT_API_BASE_URL = "https://api.otwoostores.com/restful";

const getBaseUrl = () => {
  if (typeof process === "undefined") return DEFAULT_API_BASE_URL;
  if (typeof window === "undefined") {
    const serverOnly = process.env.API_BASE_URL?.trim();
    if (serverOnly) return serverOnly;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return envUrl || DEFAULT_API_BASE_URL;
};

/** Public REST base (no trailing slash) — product IMAGE_URL paths resolve against this origin. */
export function getApiBaseUrl() {
  return getBaseUrl().replace(/\/$/, "");
}

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

/** Some PHP endpoints emit UTF-8 BOM or stray bytes before `{...}` JSON — `response.json()` then throws. */
function parseJsonLoose(raw) {
  let t = String(raw ?? "");
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  t = t.replace(/^\uFEFF/, "").trimStart();
  const m = t.match(/[[{]/);
  if (m && m.index != null && m.index > 0) t = t.slice(m.index);
  return JSON.parse(t);
}

/**
 * Generic API request – Swagger ke har endpoint ke liye use kar sakte hain
 * @param {string} path - e.g. "/api/customers", "/api/orders"
 * @param {RequestInit} options - fetch options (method, body, headers)
 */
export async function apiRequest(path, options = {}) {
  let url;
  if (path.startsWith("http")) {
    url = path;
  } else if (typeof window !== "undefined" && path.startsWith("/api/")) {
    url = new URL(path.startsWith("/") ? path : `/${path}`, window.location.origin).href;
  } else {
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const token = getAuthToken();
  const body = options.body;
  const isFormData =
    typeof FormData !== "undefined" &&
    body != null &&
    (body instanceof FormData ||
      (typeof body === "object" &&
        Object.prototype.toString.call(body) === "[object FormData]"));
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  const response = await fetch(url, config);

  const rawText = await response.text();

  if (!response.ok) {
    let message = `API Error: ${response.status}`;
    try {
      const parsed = parseJsonLoose(rawText);
      message = parsed.message || parsed.error || message;
    } catch (_) {
      if (response.status === 404 && rawText.trimStart().startsWith("<!"))
        message = "API not reachable. Check your internet and that the API URL is correct.";
    }
    throw new Error(message);
  }

  try {
    return parseJsonLoose(rawText);
  } catch (_) {
    return rawText;
  }
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

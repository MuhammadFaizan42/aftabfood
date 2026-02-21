/**
 * Sales visits – store and list customer visits (order placed or no-order with remarks).
 * Uses IndexedDB for now; replace with API calls when backend is ready.
 */
import { putOne, getAll } from "./idb";

const STORE = "visits";

const NO_ORDER_REASONS = [
  { value: "not_available", label: "Customer not available" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "price_issue", label: "Price / payment issue" },
  { value: "will_order_later", label: "Will order later" },
  { value: "shop_closed", label: "Shop closed" },
  { value: "other", label: "Other" },
];

export { NO_ORDER_REASONS };

function generateId() {
  return "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

/**
 * Save a visit (no order with reason + remarks, or with order_trns_id if order placed).
 * @param {Object} payload
 * @param {string} payload.party_code
 * @param {string} payload.customer_name
 * @param {string} payload.visit_date - YYYY-MM-DD
 * @param {boolean} payload.order_placed
 * @param {string} [payload.order_trns_id]
 * @param {string} [payload.no_order_reason]
 * @param {string} [payload.remarks]
 */
export async function saveVisit(payload) {
  const id = payload.id || generateId();
  const record = {
    id,
    party_code: String(payload.party_code ?? ""),
    customer_name: String(payload.customer_name ?? "—"),
    visit_date: String(payload.visit_date ?? "").slice(0, 10),
    order_placed: Boolean(payload.order_placed),
    order_trns_id: payload.order_trns_id || null,
    no_order_reason: payload.no_order_reason || null,
    remarks: payload.remarks || "",
    created_at: payload.created_at || new Date().toISOString(),
  };
  await putOne(STORE, record);
  return id;
}

/**
 * Get visits in date range. If no dates, returns all.
 * @param {string} [fromDate] - YYYY-MM-DD
 * @param {string} [toDate] - YYYY-MM-DD
 */
export async function getVisits(fromDate, toDate) {
  const all = await getAll(STORE);
  if (!fromDate && !toDate) return all.sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
  const from = String(fromDate || "").slice(0, 10);
  const to = String(toDate || "").slice(0, 10);
  return all
    .filter((v) => {
      const d = String(v.visit_date || "").slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
}

/**
 * Get recent visits for a specific customer (party_code). Sorted by date descending.
 * @param {string} partyCode
 * @param {number} [limit] - max number to return (default 10)
 */
export async function getVisitsByPartyCode(partyCode, limit = 10) {
  if (!partyCode) return [];
  const all = await getAll(STORE);
  const filtered = all
    .filter((v) => String(v.party_code || "").trim() === String(partyCode).trim())
    .sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
  return limit ? filtered.slice(0, limit) : filtered;
}

export function getReasonLabel(value) {
  return NO_ORDER_REASONS.find((r) => r.value === value)?.label || value || "—";
}

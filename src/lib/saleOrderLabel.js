/**
 * Display sale orders as SO/YYYY/NNNNN (5-digit sequence). Accepts API strings or numeric trns/order ids.
 */

const SO_SLASH_PATTERN = /^SO\s*\/\s*(\d{4})\s*\/\s*(\d+)\s*$/i;
const SO_LOOSE_PATTERN = /SO\s*\/\s*(\d{4})\s*\/\s*(\d+)/i;

export function pickYearFromOrderContext(orderDateStr) {
  if (orderDateStr != null && String(orderDateStr).trim()) {
    const s = String(orderDateStr).trim();
    const iso = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.slice(0, 4);
    const m = s.match(/(\d{4})/);
    if (m) return m[1];
  }
  return String(new Date().getFullYear());
}

function padSequence(n, width = 5) {
  const digits = String(n).replace(/\D/g, "");
  const num = digits === "" ? "0" : String(parseInt(digits, 10));
  return num.padStart(width, "0");
}

export function isNonSoOrderIdParam(orderId) {
  if (orderId == null) return true;
  const s = String(orderId);
  return s.startsWith("ORD-") || s.startsWith("offline_");
}

/**
 * @param {string|number|null|undefined} raw - order_number, order_id, trns_id from API or URL
 * @param {{ orderDate?: string, trnsFallback?: string|number }} [ctx]
 */
export function formatSaleOrderDisplay(raw, ctx = {}) {
  const year = pickYearFromOrderContext(ctx.orderDate);
  const s = raw == null ? "" : String(raw).trim();

  if (!s) {
    const tid = ctx.trnsFallback;
    if (tid != null && String(tid).trim() !== "" && /^\d+$/.test(String(tid).trim())) {
      return `SO/${year}/${padSequence(tid)}`;
    }
    return `SO/${year}/00000`;
  }

  const exact = s.match(SO_SLASH_PATTERN);
  if (exact) {
    return `SO/${exact[1]}/${padSequence(exact[2])}`;
  }

  const loose = s.match(SO_LOOSE_PATTERN);
  if (loose) {
    return `SO/${loose[1]}/${padSequence(loose[2])}`;
  }

  if (/^\d+$/.test(s)) {
    return `SO/${year}/${padSequence(s)}`;
  }

  return s;
}

/** First non-empty string among keys on object (API shape varies). */
export function pickSaleOrderRawLabel(d) {
  if (!d || typeof d !== "object") return "";
  const keys = [
    "order_number",
    "SO_NUM",
    "so_num",
    "sale_order_no",
    "SALE_ORDER_NO",
    "ORDER_NO",
    "order_no",
    "BRV_NUM",
    "brv_num",
    "DOC_NO",
    "doc_no",
    "order_id",
    "ORDER_ID",
  ];
  for (const k of keys) {
    const v = d[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

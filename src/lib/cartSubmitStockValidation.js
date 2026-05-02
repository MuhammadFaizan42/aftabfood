/**
 * Pre-submit checks: cart lines vs cached product snapshot (STOCK, UOM, CON_RATE).
 * Aligns with product listing stock display (primary UOM = API STOCK; secondary = STOCK × CON_RATE).
 */

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function normalizeUomKey(s) {
  return String(s ?? "").trim().toLowerCase();
}

function uomResolveFromRaw(raw, selectedUom) {
  const unitMeasure = String(raw.UOM ?? raw.unitOfMeasure ?? "Unit").trim() || "Unit";
  const rawOpts = raw.UOM_OPTIONS ?? raw.uom_options;
  let uomOptions = [];
  if (Array.isArray(rawOpts) && rawOpts.length) {
    uomOptions = [...new Set(rawOpts.map((x) => String(x ?? "").trim()).filter(Boolean))];
  }
  if (!uomOptions.length) uomOptions = [unitMeasure];
  const base = uomOptions.some((o) => o === unitMeasure) ? unitMeasure : uomOptions[0];
  const rawSel =
    selectedUom != null && String(selectedUom).trim() !== ""
      ? String(selectedUom).trim()
      : base;
  return uomOptions.some((o) => o === rawSel) ? rawSel : base;
}

/** Max orderable qty in the line’s selected UOM (same rules as product listing). */
export function getDisplayStockForProductRaw(raw, selectedUom) {
  if (!raw || typeof raw !== "object") return 0;
  const base = Math.max(0, Number(raw.STOCK ?? raw.QTY ?? raw.stock ?? 0) || 0);
  const primary = normalizeUomKey(raw.UOM ?? raw.unitOfMeasure ?? "");
  const conRateNum = Number(raw.CON_RATE ?? raw.con_rate);
  const validRate = Number.isFinite(conRateNum) && conRateNum > 0 ? conRateNum : 0;
  const resolved = uomResolveFromRaw(raw, selectedUom);
  const sel = normalizeUomKey(resolved);

  if (!validRate) return round2(base);
  if (sel === primary || sel === "") return round2(base);

  const conEqul = String(raw.CON_EQUL ?? raw.CON_EQ ?? "").trim();
  if (conEqul && sel === normalizeUomKey(conEqul)) {
    return round2(base * validRate);
  }

  const opts = Array.isArray(raw.UOM_OPTIONS) ? raw.UOM_OPTIONS : [];
  if (opts.length >= 2) {
    const first = normalizeUomKey(opts[0]);
    const secondOpt = normalizeUomKey(opts[1]);
    if (sel === secondOpt && sel !== first) {
      return round2(base * validRate);
    }
  }

  return round2(base);
}

export function findRawProductInSnapshot(products, itemId) {
  const key = String(itemId ?? "").trim();
  if (!key) return null;
  for (const p of products || []) {
    const ids = [
      p.PRODUCT_ID,
      p.SKU,
      p.PK_INV_ID,
      p.PK_ID,
      p.CODE,
      p.ITEM_CODE,
      p.product_id,
      p.id,
    ]
      .filter((x) => x != null && String(x).trim() !== "")
      .map((x) => String(x).trim());
    if (ids.includes(key)) return p;
  }
  return null;
}

/**
 * @param {Array<object>} orderItems — rows with quantity, itemIdForApi, name, uom
 * @param {object[]} products — IDB / API product rows
 * @param {{ skipWhenProductMissing?: boolean }} options — if true, unmatched lines are skipped (e.g. offline with no cache)
 * @returns {Array<{ name: string, message: string }>}
 */
export function validateCartLinesAgainstProductSnapshot(orderItems, products, options = {}) {
  const { skipWhenProductMissing = false } = options;
  const issues = [];

  for (const row of orderItems || []) {
    const qty = round2(Number(row.quantity ?? row.qty ?? 0) || 0);
    if (qty <= 0) continue;

    const itemId = String(row.itemIdForApi ?? row.id ?? row.sku ?? "").trim();
    const name =
      String(row.name ?? row.itemName ?? row.product_name ?? "Product").trim() || "Product";

    const p = findRawProductInSnapshot(products, itemId);
    if (!p) {
      if (skipWhenProductMissing) continue;
      issues.push({
        name,
        message: `${name}: not found in the product list. Open the product listing once while online to refresh, or remove this line.`,
      });
      continue;
    }

    const baseStock = Math.max(0, Number(p.STOCK ?? p.QTY ?? p.stock ?? 0) || 0);
    if (baseStock <= 0) {
      issues.push({
        name,
        message: `${name} is out of stock. Remove it or set quantity to zero before placing the order.`,
      });
      continue;
    }

    const lineUom = String(row.uom ?? row.UOM ?? "").trim();
    const maxQ = getDisplayStockForProductRaw(p, lineUom);
    if (qty > maxQ + 0.0001) {
      issues.push({
        name,
        message: `${name}: quantity exceeds available stock for the selected unit of measure.`,
      });
    }
  }

  return issues;
}

export function formatCartStockBlockMessage(issues) {
  if (!issues?.length) return "";
  const lines = issues.map((i) => i.message);
  return ["You cannot place this order:", "", ...lines].join("\n");
}

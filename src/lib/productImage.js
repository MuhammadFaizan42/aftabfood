/** Shared product image URL resolution + catalog enrichment for cart / review / order modals */

export const DEFAULT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24'%3E📦%3C/text%3E%3C/svg%3E";

const DEFAULT_API_BASE = "https://api.otwoostores.com/restful";

export function getApiBaseForImages() {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (env && String(env).trim()) return String(env).trim().replace(/\/$/, "");
  }
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

/** Relative paths from the API → absolute URLs the browser can load */
export function resolveProductImageUrl(src) {
  if (src == null) return "";
  const s = String(src).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const base = getApiBaseForImages();
  try {
    const u = new URL(base.startsWith("http") ? base : `https://${base}`);
    if (s.startsWith("/")) return `${u.origin}${s}`;
  } catch {
    /* ignore */
  }
  return `${base}/${s.replace(/^\/+/, "")}`;
}

export function pickImageFromCachedProduct(p) {
  if (!p || typeof p !== "object") return "";
  const v =
    p.IMAGE_URL ??
    p.IMAGE ??
    p.PIC ??
    p.IMG ??
    p.image ??
    p.PHOTO ??
    p.PRODUCT_IMAGE ??
    p.ITEM_IMAGE ??
    p.FILE_PATH ??
    p.file_path ??
    p.photo_url ??
    "";
  return String(v).trim();
}

/** Order line / review line: nested product + alternate field names */
export function pickImageFromOrderLine(r) {
  if (!r || typeof r !== "object") return "";
  const nested = r.product ?? r.item ?? r.product_info ?? r.PRODUCT ?? {};
  const candidates = [
    r.image,
    r.IMAGE_URL,
    r.image_url,
    r.IMAGE,
    r.PIC,
    r.IMG,
    r.PHOTO,
    r.PRODUCT_IMAGE,
    r.ITEM_IMAGE,
    r.THUMBNAIL,
    r.thumbnail_url,
    r.FILE_PATH,
    r.file_path,
    nested.image,
    nested.IMAGE_URL,
    nested.image_url,
    nested.IMAGE,
    nested.PIC,
    nested.IMG,
    nested.PHOTO,
    nested.PRODUCT_IMAGE,
    nested.FILE_PATH,
    nested.file_path,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim()) return String(c).trim();
  }
  return "";
}

const STOCK_PLACEHOLDER_HOST = "unsplash.com";

export function isPlaceholderCartImage(url) {
  if (url == null || url === "") return true;
  if (url === DEFAULT_IMG) return true;
  if (typeof url === "string") {
    if (url.startsWith("data:image/svg+xml")) return true;
    if (url.includes(STOCK_PLACEHOLDER_HOST)) return true;
  }
  return false;
}

function normProductName(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** When IDs do not match PK_INV_ID vs PRODUCT_ID, try exact / loose name match on cached catalog */
function enrichRowsWithNameMatch(rows, products) {
  if (!products?.length) return rows;
  return rows.map((row) => {
    if (!isPlaceholderCartImage(row.image)) return row;
    const want = normProductName(row.name ?? row.itemName);
    if (want.length < 4) return row;
    for (const p of products) {
      const n = normProductName(p.PRODUCT_NAME ?? p.ITEM_NAME ?? p.name);
      if (!n) continue;
      if (n === want) {
        const raw = pickImageFromCachedProduct(p);
        const u = raw ? resolveProductImageUrl(raw) : "";
        if (u) return { ...row, image: u };
        continue;
      }
      if (want.length >= 14 && (n.includes(want) || want.includes(n))) {
        const raw = pickImageFromCachedProduct(p);
        const u = raw ? resolveProductImageUrl(raw) : "";
        if (u) return { ...row, image: u };
      }
    }
    return row;
  });
}

export function buildProductImageByIdMap(products) {
  const map = new Map();
  for (const p of products || []) {
    const raw = pickImageFromCachedProduct(p);
    if (!raw) continue;
    const url = resolveProductImageUrl(raw);
    if (!url) continue;
    for (const key of [p.PRODUCT_ID, p.SKU, p.PRODUCT_CODE, p.CODE, p.ITEM_CODE, p.PK_INV_ID, p.PK_ID, p.id]) {
      if (key != null && String(key).trim() !== "") map.set(String(key).trim(), url);
    }
  }
  return map;
}

export function buildProductRowsMap(products) {
  const map = new Map();
  for (const p of products || []) {
    for (const key of [p.PRODUCT_ID, p.SKU, p.PRODUCT_CODE, p.CODE, p.ITEM_CODE, p.PK_INV_ID, p.PK_ID, p.id]) {
      if (key != null && String(key).trim() !== "") map.set(String(key).trim(), p);
    }
  }
  return map;
}

export function enrichRowsWithCachedImages(rows, imgMap) {
  return rows.map((row) => {
    if (!isPlaceholderCartImage(row.image)) return row;
    const keys = [row.itemIdForApi, row.sku, row.id, row.itemId]
      .filter((k) => k != null && String(k) !== "" && String(k) !== "—")
      .map((k) => String(k).trim());
    for (const k of keys) {
      const url = imgMap.get(k);
      if (url) return { ...row, image: url };
    }
    return row;
  });
}

/** Fill missing/broken-placeholder images and empty SKUs from IndexedDB product cache */
export function enrichOrderTableRows(rows, products) {
  if (!rows?.length) return rows;
  const imgMap = buildProductImageByIdMap(products);
  const rowMap = buildProductRowsMap(products);
  const normalized = rows.map((r) => ({
    ...r,
    itemIdForApi: r.itemIdForApi ?? r.item_id ?? r.id ?? r.itemId,
    id: r.id ?? r.itemId ?? r.itemIdForApi,
  }));
  let withImg = enrichRowsWithCachedImages(normalized, imgMap);
  withImg = enrichRowsWithNameMatch(withImg, products);
  return withImg.map((it) => {
    const skuStr = it.sku != null ? String(it.sku).trim() : "";
    if (skuStr && skuStr !== "—") return it;
    const keys = [it.itemIdForApi, it.itemId, it.id]
      .filter((k) => k != null && String(k) !== "")
      .map((k) => String(k).trim());
    for (const k of keys) {
      const p = rowMap.get(k);
      if (p) {
        const s = p.PRODUCT_ID ?? p.SKU ?? p.CODE ?? p.PRODUCT_CODE ?? p.ITEM_CODE;
        if (s != null && String(s).trim()) return { ...it, sku: String(s).trim() };
      }
    }
    return it;
  });
}

/**
 * When IndexedDB has no image (or line IDs do not match catalog keys), fetch product.php by search (SKU / code).
 * Only runs in the browser; no-op safe when offline / API fails.
 */
export async function hydrateLineImagesFromProductApi(rows) {
  if (!rows?.length || typeof window === "undefined") return rows;
  const needApi = rows.some((r) => isPlaceholderCartImage(r.image));
  if (!needApi) return rows;

  const { getProducts } = await import("@/services/shetApi");
  const searchCache = new Map();

  async function imageUrlForSearchKey(key) {
    const k = String(key ?? "").trim();
    if (!k || k === "—") return null;
    if (searchCache.has(k)) return searchCache.get(k);
    let resolved = null;
    try {
      const res = await getProducts({ search: k, limit: 50 });
      if (res?.success && Array.isArray(res.data) && res.data.length) {
        const exact = res.data.find((p) => {
          const ids = [
            p.PRODUCT_ID,
            p.SKU,
            p.CODE,
            p.PRODUCT_CODE,
            p.ITEM_CODE,
            p.PK_INV_ID,
          ]
            .filter((x) => x != null && String(x).trim() !== "")
            .map((x) => String(x).trim());
          return ids.includes(k);
        });
        const pick = exact ?? res.data[0];
        const raw = pickImageFromCachedProduct(pick);
        if (raw) resolved = resolveProductImageUrl(raw) || null;
      }
    } catch {
      resolved = null;
    }
    searchCache.set(k, resolved);
    return resolved;
  }

  const out = [];
  for (const row of rows) {
    if (!isPlaceholderCartImage(row.image)) {
      out.push(row);
      continue;
    }
    const keys = [
      row.sku,
      row.itemIdForApi,
      row.itemId,
      row.id,
      row.item_id,
    ]
      .filter((x) => x != null && String(x).trim() && String(x) !== "—")
      .map((x) => String(x).trim());
    const dedup = new Set();
    let url = null;
    for (const key of keys) {
      if (dedup.has(key)) continue;
      dedup.add(key);
      url = await imageUrlForSearchKey(key);
      if (url) break;
    }
    if (!url) {
      const nm = String(row.name ?? row.itemName ?? "").trim();
      if (nm.length >= 10) {
        url = await imageUrlForSearchKey(nm.slice(0, 80));
      }
    }
    out.push(url ? { ...row, image: url } : row);
  }
  return out;
}

/** IndexedDB enrich + optional live product.php lookup for remaining placeholders */
export async function enrichOrderLinesWithImages(rows, products, options = {}) {
  const { hydrateFromApi = true } = options;
  if (!rows?.length) return rows;
  const base = enrichOrderTableRows(rows, products ?? []);
  if (!hydrateFromApi) return base;
  return hydrateLineImagesFromProductApi(base);
}

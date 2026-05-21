/**
 * Download product images during online bootstrap and serve data URLs offline.
 */
import { getAll, getByKey, putOne, setMeta } from "../idb";
import { pickImageFromCachedProduct, resolveProductImageUrl, isPlaceholderCartImage } from "../productImage";

const STORE = "productImages";
const MAX_IMAGE_BYTES = 800 * 1024;
const DEFAULT_CONCURRENCY = 6;

let _urlMap = null;

export function invalidateProductImageUrlMap() {
  _urlMap = null;
}

function productCacheKey(p) {
  return String(p.id ?? p.PK_INV_ID ?? p.PK_ID ?? p.PRODUCT_ID ?? p.SKU ?? "").trim();
}

function remoteSrcForProduct(p) {
  const raw = pickImageFromCachedProduct(p);
  if (!raw || isPlaceholderCartImage(raw)) return "";
  const abs = resolveProductImageUrl(raw);
  if (!abs || isPlaceholderCartImage(abs)) return "";
  return abs;
}

async function fetchImageDataUrl(absoluteUrl) {
  if (!absoluteUrl || typeof window === "undefined") return null;
  const proxy = `/api/catalog-image?url=${encodeURIComponent(absoluteUrl)}`;
  const res = await fetch(proxy, { cache: "force-cache" });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_IMAGE_BYTES) return null;
  const blob = new Blob([buf], { type: res.headers.get("content-type") || "image/jpeg" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Prefetch images for cached products (call after loadProducts while online).
 */
export async function prefetchProductImages(products, options = {}) {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { cached: 0, skipped: 0, failed: 0 };
  }
  const { limit = 2500, concurrency = DEFAULT_CONCURRENCY } = options;
  const list = (products || []).slice(0, limit);
  let cached = 0;
  let skipped = 0;
  let failed = 0;
  let index = 0;

  async function worker() {
    for (;;) {
      const i = index++;
      if (i >= list.length) break;
      const p = list[i];
      const id = productCacheKey(p);
      const src = remoteSrcForProduct(p);
      if (!id || !src) {
        skipped++;
        continue;
      }
      try {
        const existing = await getByKey(STORE, id);
        if (existing?.dataUrl && existing.sourceUrl === src) {
          cached++;
          continue;
        }
        const dataUrl = await fetchImageDataUrl(src);
        if (!dataUrl) {
          failed++;
          continue;
        }
        await putOne(STORE, {
          id,
          dataUrl,
          sourceUrl: src,
          updatedAt: Date.now(),
        });
        cached++;
      } catch {
        failed++;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, list.length || 1) }, () => worker());
  await Promise.all(workers);
  invalidateProductImageUrlMap();
  return { cached, skipped, failed };
}

/** In-memory map productId → data URL for fast listing render */
export async function getProductImageUrlMap() {
  if (_urlMap) return _urlMap;
  try {
    const rows = await getAll(STORE);
    _urlMap = new Map();
    for (const r of rows) {
      if (r?.id && r?.dataUrl) _urlMap.set(String(r.id), r.dataUrl);
    }
  } catch {
    _urlMap = new Map();
  }
  return _urlMap;
}

/**
 * Prefer cached offline image; fall back to resolved remote URL.
 */
export async function getDisplayImageForProduct(p, remoteFallback = "") {
  const id = productCacheKey(p);
  if (id) {
    const map = await getProductImageUrlMap();
    const hit = map.get(id);
    if (hit) return hit;
  }
  const raw = remoteFallback || remoteSrcForProduct(p);
  return raw ? resolveProductImageUrl(raw) : "";
}

/** Merge cached data URLs onto product rows for offline listing */
export async function attachCachedImagesToProducts(products) {
  const map = await getProductImageUrlMap();
  return (products || []).map((p) => {
    const id = productCacheKey(p);
    const dataUrl = id ? map.get(id) : null;
    if (!dataUrl) return p;
    return { ...p, _cachedImageDataUrl: dataUrl };
  });
}

export async function recordProductImagePrefetchStats(stats) {
  try {
    await setMeta("product_images_last_prefetch", { ...stats, at: Date.now() });
  } catch {
    /* ignore */
  }
}

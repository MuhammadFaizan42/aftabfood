"use client";
import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { buildProductCatalogPdfBlob, shareOrDownloadPdf } from "@/lib/productCatalogPdf";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import Dropdown from "../../components/common/Dropdown";
import { getProducts, addToCart, removeCartItem } from "@/services/shetApi";
import { getSaleOrderPartyCode, setSaleOrderPartyCode, getCartTrnsId, setCartTrnsId, clearCartTrnsId } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { getCachedProducts } from "@/lib/offline/bootstrapLoader";
import { getDB } from "@/lib/idb";
import { addToOfflineCart, removeFromOfflineCart, getOfflineCart, updateOfflineCartItem } from "@/lib/offline/offlineCart";
import { INSUFFICIENT_STOCK_INCREASE_MSG } from "@/lib/stockMessages";

const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop";

const GRID_COLS_STORAGE_KEY = "product_grid_cols";
/** &lt;768px: max 2 cols; 768–1023px: max 4; ≥1024px: max 6 */
function maxColsForWidth(width) {
  if (width < 768) return 2;
  if (width < 1024) return 4;
  return 6;
}

const QTY_BUTTON_STEP = 1;
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function formatQty(n) {
  const v = Number(n) || 0;
  // show up to 2 decimals, but trim trailing zeros
  return v % 1 === 0 ? String(v.toFixed(0)) : String(round2(v));
}

function isProductInStock(p) {
  if (!p) return false;
  if (typeof p.inStock === "boolean") return p.inStock;
  const n = Number(p.stock ?? NaN);
  if (!Number.isNaN(n)) return n > 0;
  return false;
}

function productHasBatchOptions(product) {
  if (!product) return false;
  const hasExpiry =
    Array.isArray(product.batchExpiryList) && product.batchExpiryList.length > 0;
  const hasBatchNos =
    Array.isArray(product.batchNumbers) && product.batchNumbers.length > 0;
  const def = String(product.defaultBatch ?? "").trim();
  const hasDefault = Boolean(def) && def.toLowerCase() !== "no batch";
  // If the backend expects a batch, it may come as a single default batch (legacy) or as options.
  return hasExpiry || hasBatchNos || hasDefault;
}

function batchIsSelected(batchNo) {
  const b = String(batchNo ?? "").trim();
  return Boolean(b) && b.toLowerCase() !== "no batch";
}

function batchIsMandatoryForProduct(product) {
  // Requirement: if product has stock (in-stock), Batch No must be selected.
  return Boolean(product?.inStock);
}

/** Normalize API batch list: arrays, PHP object-maps, JSON strings, or comma-separated BATCH_NOS. */
function coerceProductBatchTokens(val) {
  if (val == null) return [];
  if (Array.isArray(val)) {
    return val.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (typeof val === "object") {
    return Object.values(val)
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
  }
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) return [];
    if (t.startsWith("[")) {
      try {
        return coerceProductBatchTokens(JSON.parse(t));
      } catch {
        /* fall through */
      }
    }
    return t
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function mergeBatchListsUnique(primary, secondary) {
  const out = [];
  const add = (arr) => {
    for (const x of arr) {
      if (x && !out.includes(x)) out.push(x);
    }
  };
  add(primary);
  add(secondary);
  return out;
}

/** BATCH_EXPIRY: [{ batch_no, exp_date }] from product API; also backfill from BATCH_NOS + BATCH_EXP_DATES when no array. */
function normalizeBatchExpiryList(p, batchNosTokens) {
  const raw = p.BATCH_EXPIRY ?? p.batch_expiry;
  const out = [];
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const batch_no = String(row.batch_no ?? row.BATCH_NO ?? "").trim();
      const exp_date = String(row.exp_date ?? row.EXP_DATE ?? row.exp_dt ?? "").trim();
      if (batch_no) out.push({ batch_no, exp_date });
    }
  }
  if (!out.length && Array.isArray(batchNosTokens) && batchNosTokens.length) {
    const expStr = p.BATCH_EXP_DATES ?? p.batch_exp_dates ?? "";
    const expParts =
      typeof expStr === "string" && expStr.trim()
        ? expStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];
    for (let i = 0; i < batchNosTokens.length; i++) {
      const batch_no = String(batchNosTokens[i] ?? "").trim();
      if (!batch_no) continue;
      out.push({ batch_no, exp_date: expParts[i] ?? expParts[0] ?? "" });
    }
  }
  return out;
}

function mapApiProduct(p) {
  // IDs / basic fields as per your API shape
  const id =
    p.PK_INV_ID ??
    p.PK_ID ??
    p.PRODUCT_ID ??
    p.id ??
    p.SKU ??
    String(Math.random());

  const name = p.PRODUCT_NAME ?? p.ITEM_NAME ?? p.name ?? "—";
  const sku = p.PRODUCT_ID ?? p.SKU ?? p.PRODUCT_CODE ?? p.CODE ?? "";
  const category = p.CATEGORY ?? p.category ?? "";

  // ITEM_RATE aa raha hai string me (e.g. "1") – usko number banayen
  const itemRateNumber = Number(p.ITEM_RATE ?? 0) || 0;
  // UI ke liye 2-decimal string with £, jaise screenshot me
  const priceDisplay = `£${itemRateNumber.toFixed(2)}`;

  const unitMeasure =
    p.UOM ??
    p.UNIT_OF_MEASURE ??
    p.UOM_DESC ??
    p.PER_VAL ??
    p.UNIT ??
    p.unitOfMeasure ??
    "Unit";

  const rawUomOpts = p.UOM_OPTIONS ?? p.uom_options;
  let uomOptions = [];
  if (Array.isArray(rawUomOpts) && rawUomOpts.length) {
    uomOptions = [...new Set(rawUomOpts.map((x) => String(x ?? "").trim()).filter(Boolean))];
  }
  if (!uomOptions.length) {
    const single = String(unitMeasure || "Unit").trim() || "Unit";
    uomOptions = [single];
  }

  const fromNumbers = coerceProductBatchTokens(p.BATCH_NUMBERS ?? p.batch_numbers);
  const fromNosString = coerceProductBatchTokens(p.BATCH_NOS ?? p.batch_nos ?? "");
  const batchExpiryList = normalizeBatchExpiryList(p, fromNosString);
  const fromExpiryBatches = batchExpiryList.map((x) => x.batch_no);
  const batchNumbers = mergeBatchListsUnique(
    mergeBatchListsUnique(fromExpiryBatches, fromNumbers),
    fromNosString
  );
  const defaultBatch = batchExpiryList[0]?.batch_no ?? batchNumbers[0] ?? "";

  const stockVal = p.STOCK ?? p.QTY ?? p.stock ?? 0;
  const stock = Number(stockVal) || 0;

  // Prefer IMAGE_URL from API, then other possible image fields
  const img =
    p.IMAGE_URL ??
    p.IMAGE ??
    p.PIC ??
    p.IMG ??
    p.image ??
    "";

  return {
    id,
    name,
    description: p.DESCRIPTION
      ? `${p.DESCRIPTION} • SKU: ${sku}`
      : sku
        ? `SKU: ${sku}`
        : "",
    // UI me dikhne wala price
    price: priceDisplay,
    // Unit price controls bhi isi ko use karen
    unitPrice: priceDisplay,
    // Saath me clean numeric ITEM_RATE bhi expose kar dein
    itemRate: itemRateNumber,
    unitOfMeasure: unitMeasure,
    uomOptions,
    batchNumbers,
    batchExpiryList,
    defaultBatch,
    image: img && img.trim() ? img.trim() : DEFAULT_PRODUCT_IMAGE,
    sku,
    inStock: stock > 0,
    category,
    stock,
    _raw: p,
  };
}

/** Dropdown value + options from API UOM_OPTIONS (fallback single UOM). */
function uomSelectModel(product, selectedForProduct) {
  const opts = (Array.isArray(product.uomOptions) && product.uomOptions.length
    ? product.uomOptions
    : [product.unitOfMeasure]
  ).map((u) => ({ value: u, label: u }));
  const base = opts.some((o) => o.value === product.unitOfMeasure)
    ? product.unitOfMeasure
    : opts[0]?.value ?? product.unitOfMeasure;
  const raw = selectedForProduct ?? base;
  const value = opts.some((o) => o.value === raw) ? raw : base;
  return { options: opts, value };
}

/** Composite value for expiry rows: "batch_no|exp_date" (exp may be empty). */
function batchExpiryOptionValue(row) {
  return `${row.batch_no}|${row.exp_date || ""}`;
}

/** Dropdown for BATCH_EXPIRY (label: batch + exp) or legacy BATCH_NOS list. */
function batchSelectModel(product, selectedForProduct) {
  const expiryRows = Array.isArray(product.batchExpiryList) ? product.batchExpiryList : [];
  if (expiryRows.length) {
    const opts = expiryRows.map((row) => ({
      value: batchExpiryOptionValue(row),
      label: row.exp_date ? `${row.batch_no} · Exp: ${row.exp_date}` : row.batch_no,
    }));
    const firstVal = opts[0].value;
    const raw = selectedForProduct != null && selectedForProduct !== "" ? String(selectedForProduct) : firstVal;
    if (opts.some((o) => o.value === raw)) {
      return { options: opts, value: raw };
    }
    const prefix = raw.split("|")[0];
    const byBatch = opts.find((o) => o.value.split("|")[0] === prefix);
    return { options: opts, value: byBatch ? byBatch.value : firstVal };
  }

  const list =
    Array.isArray(product.batchNumbers) && product.batchNumbers.length
      ? product.batchNumbers
      : product.defaultBatch
        ? [product.defaultBatch]
        : [];
  if (!list.length) {
    return { options: [{ value: "", label: "No batch" }], value: "" };
  }
  const opts = list.map((b) => ({ value: b, label: b }));
  const base =
    product.defaultBatch && list.includes(product.defaultBatch)
      ? product.defaultBatch
      : list[0];
  const raw = selectedForProduct ?? base;
  const value = list.includes(raw) ? raw : base;
  return { options: opts, value };
}

function categoryNameFromRaw(p) {
  const c = p?.CATEGORY ?? p?.category;
  return c != null && String(c).trim() ? String(c).trim() : null;
}

/** If API sends a full category list on product.php, use it and skip scanning every row. */
function categoriesFromProductApiResponse(res) {
  const raw = res?.categories ?? res?.CATEGORIES ?? res?.data?.categories;
  if (!Array.isArray(raw) || !raw.length) return null;
  const out = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
    else if (item && typeof item === "object") {
      const n = item.CATEGORY ?? item.category ?? item.name ?? item.NAME;
      if (n && String(n).trim()) out.push(String(n).trim());
    }
  }
  return out.length ? [...new Set(out)].sort((a, b) => a.localeCompare(b)) : null;
}

/** Paginate product.php to collect every distinct CATEGORY (chips were only from the first limit rows before). */
/** Same caps as offline bootstrap – listing was stuck at limit 100 so many SKUs never appeared. */
const PRODUCTS_LIST_MAX = 2000;
const PRODUCTS_PAGE_SIZE = 500;

function dedupeRawProducts(rows) {
  const map = new Map();
  for (const p of rows) {
    const k = String(p.PK_INV_ID ?? p.PK_ID ?? p.PRODUCT_ID ?? p.SKU ?? p.id ?? "");
    const key = k || `idx_${map.size}`;
    if (!map.has(key)) map.set(key, p);
  }
  return [...map.values()];
}

/** Paginate product.php until empty or cap (All Items / category / search). */
async function fetchProductsPaginatedOnline(params = {}) {
  const all = [];
  let offset = 0;
  for (let page = 0; page < 40; page++) {
    const res = await getProducts({
      limit: PRODUCTS_PAGE_SIZE,
      offset,
      ...params,
    });
    if (!res?.success || !Array.isArray(res.data) || res.data.length === 0) break;
    all.push(...res.data);
    if (res.data.length < PRODUCTS_PAGE_SIZE || all.length >= PRODUCTS_LIST_MAX) break;
    offset += PRODUCTS_PAGE_SIZE;
  }
  return dedupeRawProducts(all).slice(0, PRODUCTS_LIST_MAX);
}

async function fetchDistinctProductCategoriesOnline() {
  const LIMIT = 500;
  const MAX_PAGES = 30;
  let offset = 0;
  const seen = new Set();
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await getProducts({ limit: LIMIT, offset });
    if (page === 0) {
      const fromMeta = categoriesFromProductApiResponse(res);
      if (fromMeta?.length) return fromMeta;
    }
    if (!res?.success || !Array.isArray(res.data)) break;
    for (const p of res.data) {
      const n = categoryNameFromRaw(p);
      if (n) seen.add(n);
    }
    if (res.data.length < LIMIT) break;
    offset += LIMIT;
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const activeDraftTrnsId = getCartTrnsId();
  const [categories, setCategories] = useState(["All Items"]);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [gridColsPreference, setGridColsPreference] = useState(4);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [cartItems, setCartItems] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [editablePrices, setEditablePrices] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [selectedBatches, setSelectedBatches] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  const [productComments, setProductComments] = useState({});
  const [cartApiLoadingId, setCartApiLoadingId] = useState(null);
  const [cartApiError, setCartApiError] = useState(null);
  const [catalogPdfBusy, setCatalogPdfBusy] = useState(null);
  const [catalogPdfError, setCatalogPdfError] = useState(null);
  /** PDF catalog: include unit prices (uses on-screen / edited prices) vs omit for sharing. */
  const [catalogPdfIncludePrice, setCatalogPdfIncludePrice] = useState(false);
  /** Product list + PDF scope: show only stock-available products */
  const [inStockOnly, setInStockOnly] = useState(true);
  const [partyCode, setPartyCode] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});

  useEffect(() => {
    const fromUrl = searchParams.get("party_code");
    const trnsFromUrl = searchParams.get("trns_id");
    const fromStorage = getSaleOrderPartyCode();
    const code = fromUrl || fromStorage || null;
    if (code) {
      setPartyCode(code);
      if (fromUrl) setSaleOrderPartyCode(code);
    } else {
      setPartyCode(null);
    }
    if (trnsFromUrl) {
      setCartTrnsId(trnsFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    getDB().catch(() => {});
  }, []);

  /** Ignores out-of-order API responses so a slow full-list fetch cannot overwrite a newer search result. */
  const fetchSeqRef = useRef(0);

  const fetchProducts = useCallback(async (opts = {}) => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const listParams = {
          ...(opts.category && opts.category !== "All Items" && { category: opts.category }),
          ...(opts.search && String(opts.search).trim() && { search: String(opts.search).trim() }),
        };
        let mapped;
        try {
          const rawRows = await fetchProductsPaginatedOnline(listParams);
          mapped = rawRows.map(mapApiProduct);
          if (seq === fetchSeqRef.current) setProducts(mapped);
        } catch (apiErr) {
          const raw = await getCachedProducts({
            category: opts.category,
            search: opts.search,
          });
          mapped = raw.map(mapApiProduct);
          if (seq === fetchSeqRef.current) {
            setProducts(mapped);
            if (mapped.length > 0) {
              setError(
                isOnline
                  ? "Could not refresh from the server — showing cached products. Use refresh to try again."
                  : "Showing cached products — server unreachable."
              );
            } else {
              setError(apiErr instanceof Error ? apiErr.message : "Could not load products. Open when online to cache.");
            }
          }
          return mapped;
        }
        return mapped;
      }
      const raw = await getCachedProducts({
        category: opts.category,
        search: opts.search,
      });
      const mapped = raw.map(mapApiProduct);
      if (seq === fetchSeqRef.current) setProducts(mapped);
      return mapped;
    } catch (err) {
      if (seq === fetchSeqRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
        setProducts([]);
      }
      return [];
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    (async () => {
      await fetchProducts({
        category: activeCategory === "All Items" ? undefined : activeCategory,
        search: searchQuery || undefined,
      });
    })();
  }, [activeCategory, searchQuery, isOnline, fetchProducts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isOnline) {
        try {
          const names = await fetchDistinctProductCategoriesOnline();
          if (!cancelled && names.length) setCategories(["All Items", ...names]);
        } catch {
          try {
            const res = await getProducts({ limit: 100 });
            if (!cancelled && res?.success && Array.isArray(res.data)) {
              const names = [
                ...new Set(res.data.map((p) => categoryNameFromRaw(p)).filter(Boolean)),
              ].sort((a, b) => a.localeCompare(b));
              if (names.length) setCategories(["All Items", ...names]);
            }
          } catch {
            /* keep default chips */
          }
        }
      } else {
        try {
          const raw = await getCachedProducts({});
          const names = [...new Set(raw.map((p) => categoryNameFromRaw(p)).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b)
          );
          if (!cancelled && names.length) setCategories(["All Items", ...names]);
        } catch {
          /* ignore */
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isOnline]);

  useEffect(() => {
    (async () => {
      const cart = await getOfflineCart();
      if (!cart?.items?.length) return;
      const customerMatch = !cart.customer_id || cart.customer_id === partyCode;
      if (customerMatch) {
        setCartItems(
          cart.items.map((i) => ({
            id: i.product_key ?? i.item_id ?? i.product_id,
            quantity: Number(i.qty) || 0,
          }))
        );
      }
    })();
  }, [partyCode]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", onResize);
    }
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(GRID_COLS_STORAGE_KEY));
      if (Number.isFinite(v) && v >= 1 && v <= 6) setGridColsPreference(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GRID_COLS_STORAGE_KEY, String(gridColsPreference));
    } catch {
      /* ignore */
    }
  }, [gridColsPreference]);

  useEffect(() => {
    const q = products.reduce((acc, p) => ({ ...acc, [p.id]: productQuantities[p.id] ?? 0 }), {});
    const p = products.reduce((acc, p) => ({
      ...acc,
      [p.id]:
        editablePrices[p.id] ??
        Number(String(p.price ?? "").replace(/[^\d.-]/g, "") || 0).toFixed(2),
    }), {});
    const u = products.reduce((acc, p) => ({ ...acc, [p.id]: selectedUnits[p.id] ?? p.unitOfMeasure }), {});
    const batchDefaults = products.reduce((acc, p) => {
      let first = "";
      if (Array.isArray(p.batchExpiryList) && p.batchExpiryList.length) {
        first = batchExpiryOptionValue(p.batchExpiryList[0]);
      } else {
        first =
          p.defaultBatch ?? (Array.isArray(p.batchNumbers) && p.batchNumbers[0] ? p.batchNumbers[0] : "");
      }
      return { ...acc, [p.id]: selectedBatches[p.id] ?? first ?? "" };
    }, {});
    const c = products.reduce((acc, p) => ({ ...acc, [p.id]: productComments[p.id] ?? "" }), {});
    setProductQuantities((prev) => ({ ...q, ...prev }));
    setEditablePrices((prev) => ({ ...p, ...prev }));
    setSelectedUnits((prev) => ({ ...u, ...prev }));
    setSelectedBatches((prev) => ({ ...batchDefaults, ...prev }));
    setProductComments((prev) => ({ ...c, ...prev }));
  }, [products]);

  const maxColsForScreen = maxColsForWidth(windowWidth);
  const effectiveGridCols = Math.min(Math.max(1, gridColsPreference), maxColsForScreen);

  /** Same filters as API/IDB; reapplies on the client so a stale response cannot show the wrong rows on mobile. */
  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory && activeCategory !== "All Items") {
      const cat = activeCategory.trim().toLowerCase();
      list = list.filter(
        (p) => String(p.category ?? "").trim().toLowerCase() === cat,
      );
    }
    const q = searchQuery.trim();
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.name ?? "").toLowerCase().includes(s) ||
          String(p.sku ?? "").toLowerCase().includes(s),
      );
    }
    if (inStockOnly) {
      list = list.filter((p) => isProductInStock(p));
    }
    return list;
  }, [products, activeCategory, searchQuery, inStockOnly]);

  const catalogPriceLabelForProduct = useCallback(
    (p) => {
      const raw = editablePrices[p.id] ?? p.price ?? "";
      const n = Number(String(raw).replace(/[^\d.-]/g, ""));
      if (Number.isFinite(n)) return `£${n.toFixed(2)}`;
      const s = String(raw).trim();
      return s || "—";
    },
    [editablePrices],
  );

  const handleCatalogPdf = useCallback(
    async (mode) => {
      setCatalogPdfError(null);
      setCatalogPdfBusy(mode);
      try {
        let list;
        let title;
        const subtitleParts = [`Party: ${partyCode ?? "—"}`];
        if (catalogPdfIncludePrice) subtitleParts.push("Prices shown on list");
        subtitleParts.push(inStockOnly ? "In-stock only" : "All products");

        if (mode === "full") {
          const raw = isOnline
            ? await fetchProductsPaginatedOnline({})
            : await getCachedProducts({});
          list = raw.map(mapApiProduct);
          if (inStockOnly) list = list.filter((p) => isProductInStock(p));
          title = "Majestic — Full catalog (all categories)";
          if (!isOnline) subtitleParts.push("Offline: cached catalog");
        } else {
          list = filteredProducts;
          title =
            activeCategory === "All Items"
              ? "Majestic — Current list"
              : `Majestic — ${activeCategory}`;
          if (searchQuery) subtitleParts.push(`Search: ${searchQuery}`);
        }

        const catalogItems = list.map((p) => {
          const base = {
            image: p.image,
            category: (p.category && String(p.category).trim()) || "—",
            name: p.name || "—",
            sku: String(p.sku ?? "—"),
            uom: p.unitOfMeasure || "—",
            inStock: !!p.inStock,
            stock: p.stock ?? 0,
          };
          if (catalogPdfIncludePrice) {
            return { ...base, price: catalogPriceLabelForProduct(p) };
          }
          return base;
        });

        if (!catalogItems.length) {
          setCatalogPdfError("No products to put in the PDF.");
          return;
        }

        /* Keep the same order as the product listing (API / cache / filtered list) — do not re-sort by category/name. */

        const blob = await buildProductCatalogPdfBlob(catalogItems, {
          title,
          subtitle: subtitleParts.join(" · "),
          showPrice: catalogPdfIncludePrice,
        });

        const safeParty = String(partyCode || "catalog").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 28);
        const scope =
          mode === "full"
            ? "all"
            : activeCategory === "All Items"
              ? "current"
              : activeCategory.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 24);
        const priceTag = catalogPdfIncludePrice ? "with_price" : "no_price";
        const stockTag = inStockOnly ? "in_stock" : "all_stock";
        const filename = `Majestic_${safeParty}_${scope}_${priceTag}_${stockTag}_${new Date().toISOString().slice(0, 10)}.pdf`;

        const hint = `Product catalog${catalogPdfIncludePrice ? " with prices" : ""} (${catalogItems.length} items). PDF: ${filename}.`;
        await shareOrDownloadPdf(blob, filename, hint);
      } catch (e) {
        console.error(e);
        setCatalogPdfError(e instanceof Error ? e.message : "Could not create PDF.");
      } finally {
        setCatalogPdfBusy(null);
      }
    },
    [
      isOnline,
      partyCode,
      filteredProducts,
      activeCategory,
      searchQuery,
      catalogPdfIncludePrice,
      catalogPriceLabelForProduct,
      inStockOnly,
    ],
  );

  const handleQuantityChange = (product, delta) => {
    const productId = product.id;
    if (delta > 0 && !product.inStock) return;
    const maxQ = product.inStock ? Math.max(0, Number(product.stock) || 0) : 0;
    setProductQuantities((prev) => {
      const cur = prev[productId] || 0;
      let next = cur + delta;
      if (next < 0) next = 0;
      if (delta > 0 && product.inStock && maxQ > 0 && next > maxQ) next = maxQ;
      return { ...prev, [productId]: round2(next) };
    });
  };

  const handlePriceEdit = (productId, newPrice) => {
    setEditablePrices((prev) => ({
      ...prev,
      [productId]: newPrice,
    }));
  };

  const togglePriceEdit = (productId) => {
    setEditingPrice(editingPrice === productId ? null : productId);
  };

  /** Backend ko item_id me PRODUCT_ID (sku) bhejte hain */
  const getItemIdForApi = (p) => (p && (p.sku || p._raw?.PRODUCT_ID)) || String(p?.id ?? "");

  /** "£2.00" / "2.00" se number nikaalna */
  const parseUnitPrice = (priceStr, fallbackNum = 0) => {
    if (priceStr == null) return fallbackNum;
    const s = String(priceStr).replace(/[^\d.-]/g, "").trim();
    const n = Number(s);
    return Number.isNaN(n) ? fallbackNum : n;
  };

  const getAddToCartPayload = (product) => {
    const productId = product.id;
    const currentPriceStr = editablePrices[productId] ?? product.price;
    const batchList = Array.isArray(product.batchNumbers) ? product.batchNumbers : [];
    const expiryRows = Array.isArray(product.batchExpiryList) ? product.batchExpiryList : [];

    let batch_no = "";
    let exp_date = "";

    if (expiryRows.length) {
      const batchDefault = batchExpiryOptionValue(expiryRows[0]);
      const rawBatch = selectedBatches[productId] ?? batchDefault;
      const sel = String(rawBatch);
      const row =
        expiryRows.find((r) => batchExpiryOptionValue(r) === sel) ??
        expiryRows.find((r) => r.batch_no === sel.split("|")[0]);
      if (row) {
        batch_no = row.batch_no;
        exp_date = row.exp_date || "";
      } else {
        const pipe = sel.indexOf("|");
        if (pipe >= 0) {
          batch_no = sel.slice(0, pipe).trim();
          exp_date = sel.slice(pipe + 1).trim();
        }
      }
      if (!batch_no && expiryRows[0]) {
        batch_no = expiryRows[0].batch_no;
        exp_date = expiryRows[0].exp_date || "";
      }
    } else {
      const batchDefault = product.defaultBatch ?? batchList[0] ?? "";
      const rawBatch = selectedBatches[productId] ?? batchDefault;
      const resolved =
        batchList.length && !batchList.includes(rawBatch) ? batchDefault : rawBatch;
      batch_no = String(resolved ?? "").trim();
      const expRaw = product._raw?.BATCH_EXP_DATES ?? product._raw?.batch_exp_dates;
      if (batch_no && expRaw != null && String(expRaw).trim()) {
        exp_date = String(expRaw).trim();
      }
    }

    return {
      unit_price: parseUnitPrice(currentPriceStr, product.itemRate ?? 0),
      uom: selectedUnits[productId] ?? product.unitOfMeasure ?? "",
      comments: productComments[productId] ?? "",
      batch_no: String(batch_no ?? "").trim(),
      exp_date,
    };
  };

  const handleAddToCart = async (product) => {
    const productId = product.id;
    const itemIdForApi = getItemIdForApi(product);
    const quantity = productQuantities[productId];
    if (quantity <= 0) return;
    if (!product.inStock) {
      setCartApiError("This product is out of stock.");
      return;
    }
    const maxQ = Math.max(0, Number(product.stock) || 0);
    if (maxQ > 0 && quantity > maxQ) {
      setCartApiError(INSUFFICIENT_STOCK_INCREASE_MSG);
      return;
    }
    if (isOnline && !partyCode) return;
    setCartApiError(null);
    setCartApiLoadingId(productId);
    const opts = getAddToCartPayload(product);
    if (batchIsMandatoryForProduct(product) && !batchIsSelected(opts.batch_no)) {
      setCartApiError("Batch No is required for this product. Please select a batch before adding to cart.");
      setCartApiLoadingId(null);
      return;
    }
    const offlinePayload = {
      item_id: itemIdForApi,
      product_id: itemIdForApi,
      product_key: productId,
      qty: quantity,
      unit_price: opts.unit_price,
      uom: opts.uom,
      comments: opts.comments,
      batch_no: opts.batch_no,
      exp_date: opts.exp_date,
      product_name: product.name,
      sku: product.sku,
      image_url: product.image ?? "",
    };
    const updateCartState = () => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === productId);
        if (existing) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: existing.quantity + quantity } : item
          );
        }
        return [...prev, { id: productId, quantity }];
      });
    };
    try {
      if (!isOnline) {
        await addToOfflineCart(partyCode || null, offlinePayload);
        updateCartState();
        return;
      }
      const trnsId = getCartTrnsId();
      const res = await addToCart(partyCode, itemIdForApi, quantity, trnsId || undefined, opts);
      const newTrnsId = res?.data?.trns_id ?? res?.trns_id;
      if (newTrnsId) setCartTrnsId(newTrnsId);
      updateCartState();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to add to cart.";
      if (rawMessage.toLowerCase().includes("only draft orders can be edited")) {
        clearCartTrnsId();
        setCartApiError(
          "This order has already been submitted and can no longer be edited. Please start a new order from the customer dashboard."
        );
      } else {
        setCartApiError(rawMessage);
        // Network/API failure: save to offline cart so items are not lost when user goes to checkout
        try {
          await addToOfflineCart(partyCode || null, offlinePayload);
          updateCartState();
          setCartApiError("Saved offline – will sync when online.");
        } catch {
          setCartApiError(rawMessage);
        }
      }
    } finally {
      setCartApiLoadingId(null);
    }
  };

  const handleUpdateCart = async (product) => {
    const productId = product.id;
    const itemIdForApi = getItemIdForApi(product);
    const quantity = productQuantities[productId];
    const trnsId = getCartTrnsId();
    if (quantity <= 0 && !trnsId && isOnline) return;
    if (quantity > 0 && !product.inStock) {
      setCartApiError("This product is out of stock. Reduce quantity to zero to remove.");
      return;
    }
    const maxQ = Math.max(0, Number(product.stock) || 0);
    if (quantity > 0 && maxQ > 0 && quantity > maxQ) {
      setCartApiError(INSUFFICIENT_STOCK_INCREASE_MSG);
      return;
    }
    setCartApiError(null);
    setCartApiLoadingId(productId);
    try {
      if (!isOnline) {
        if (quantity === 0) {
          await removeFromOfflineCart(itemIdForApi);
          setCartItems((prev) => prev.filter((item) => item.id !== productId));
        } else {
          const opts = getAddToCartPayload(product);
          if (batchIsMandatoryForProduct(product) && !batchIsSelected(opts.batch_no)) {
            setCartApiError("Batch No is required for this product. Please select a batch before updating cart.");
            return;
          }
          const cart = await getOfflineCart();
          const key = String(itemIdForApi);
          const lineExists = cart.items.some(
            (i) => String(i.item_id ?? i.product_id) === key
          );
          if (lineExists) {
            await updateOfflineCartItem(itemIdForApi, quantity, {
              unitPrice: opts.unit_price,
              uom: opts.uom,
              comments: opts.comments,
              batch_no: opts.batch_no,
              exp_date: opts.exp_date,
            });
          } else {
            await addToOfflineCart(partyCode || null, {
              item_id: itemIdForApi,
              product_id: itemIdForApi,
              product_key: productId,
              qty: quantity,
              unit_price: opts.unit_price,
              uom: opts.uom,
              comments: opts.comments,
              batch_no: opts.batch_no,
              exp_date: opts.exp_date,
              product_name: product.name,
              sku: product.sku,
              image_url: product.image ?? "",
            });
          }
          setCartItems((prev) => {
            const existing = prev.find((item) => item.id === productId);
            if (existing) {
              return prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
              );
            }
            return [...prev, { id: productId, quantity }];
          });
        }
        return;
      }
      if (quantity === 0 && trnsId) {
        await removeCartItem(trnsId, itemIdForApi);
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
      } else if (quantity > 0) {
        const opts = getAddToCartPayload(product);
        if (batchIsMandatoryForProduct(product) && !batchIsSelected(opts.batch_no)) {
          setCartApiError("Batch No is required for this product. Please select a batch before updating cart.");
          return;
        }
        const res = await addToCart(partyCode, itemIdForApi, quantity, trnsId || undefined, opts);
        const newTrnsId = res?.data?.trns_id ?? res?.trns_id;
        if (newTrnsId) setCartTrnsId(newTrnsId);
        setCartItems((prev) => {
          const existing = prev.find((item) => item.id === productId);
          if (existing) {
            return prev.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            );
          }
          return [...prev, { id: productId, quantity }];
        });
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to update cart.";
      if (rawMessage.toLowerCase().includes("only draft orders can be edited")) {
        clearCartTrnsId();
        setCartApiError(
          "This order has already been submitted and can no longer be edited. Please start a new order from the customer dashboard."
        );
      } else {
        setCartApiError(rawMessage);
        try {
          if (quantity === 0) {
            await removeFromOfflineCart(itemIdForApi);
            setCartItems((prev) => prev.filter((item) => item.id !== productId));
          } else {
            const opts = getAddToCartPayload(product);
            if (batchIsMandatoryForProduct(product) && !batchIsSelected(opts.batch_no)) {
              setCartApiError("Batch No is required for this product. Please select a batch before updating cart.");
              return;
            }
            const cart = await getOfflineCart();
            const key = String(itemIdForApi);
            const lineExists = cart.items.some(
              (i) => String(i.item_id ?? i.product_id) === key
            );
            if (lineExists) {
              await updateOfflineCartItem(itemIdForApi, quantity, {
                unitPrice: opts.unit_price,
                uom: opts.uom,
                comments: opts.comments,
                batch_no: opts.batch_no,
                exp_date: opts.exp_date,
              });
            } else {
              await addToOfflineCart(partyCode || null, {
                item_id: itemIdForApi,
                product_id: itemIdForApi,
                product_key: productId,
                qty: quantity,
                unit_price: opts.unit_price,
                uom: opts.uom,
                comments: opts.comments,
                batch_no: opts.batch_no,
                exp_date: opts.exp_date,
                product_name: product.name,
                sku: product.sku,
                image_url: product.image ?? "",
              });
            }
            setCartItems((prev) => {
              const existing = prev.find((item) => item.id === productId);
              if (existing) {
                return prev.map((item) =>
                  item.id === productId ? { ...item, quantity } : item
                );
              }
              return [...prev, { id: productId, quantity }];
            });
          }
          setCartApiError("Saved offline – will sync when online.");
        } catch {
          setCartApiError(rawMessage);
        }
      }
    } finally {
      setCartApiLoadingId(null);
    }
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const isDraftEditing = !!activeDraftTrnsId;
  // When editing an existing Draft order, allow going to cart/order-summary
  // even if cartItems is temporarily empty on this page.
  const isCartEmpty = cartItems.length === 0 && !isDraftEditing;

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(typeof window !== "undefined" && window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (partyCode === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-4">
            No customer selected. Please start from Customer Dashboard and click &quot;New Order&quot;.
          </div>
          <Link href="/new-order" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            Select Customer
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <Link
            href={partyCode ? `/customer-dashboard?party_code=${encodeURIComponent(partyCode)}` : "/customer-dashboard"}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            New Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Browse and add products to your cart
          </p>
          {!isOnline && (
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-xs">
              Offline mode – using cached data. Orders will sync when back online.
            </div>
          )}
          {activeDraftTrnsId && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-blue-800 text-xs sm:text-sm">
              <span className="font-medium">Editing Draft Order</span>
              <span className="font-semibold">#{activeDraftTrnsId}</span>
            </div>
          )}
        </div>

        {/* Category Tabs — sticky below app header while scrolling */}
        <div className="sticky z-[90] top-[max(4.5rem,env(safe-area-inset-top,0px))] sm:top-[7rem] -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/90 shadow-sm">
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 sm:px-6 sm:py-4 max-w-none">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`cursor-pointer px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar – search by name or code (API search param) + catalog PDF for WhatsApp */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto">
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700"
                role="group"
                aria-label="Stock filter"
              >
                <span className="font-medium text-gray-600 whitespace-nowrap">Show</span>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="stock_filter"
                    className="text-blue-600 focus:ring-blue-500"
                    checked={!inStockOnly}
                    onChange={() => setInStockOnly(false)}
                  />
                  <span>All products</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="stock_filter"
                    className="text-blue-600 focus:ring-blue-500"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly(true)}
                  />
                  <span>In-stock only</span>
                </label>
              </div>
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700"
                role="group"
                aria-label="Catalog PDF price option"
              >
                <span className="font-medium text-gray-600 whitespace-nowrap">Catalog PDF</span>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="catalog_pdf_price"
                    className="text-green-600 focus:ring-green-500"
                    checked={!catalogPdfIncludePrice}
                    onChange={() => setCatalogPdfIncludePrice(false)}
                  />
                  <span>Without price</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="catalog_pdf_price"
                    className="text-green-600 focus:ring-green-500"
                    checked={catalogPdfIncludePrice}
                    onChange={() => setCatalogPdfIncludePrice(true)}
                  />
                  <span>With price</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!catalogPdfBusy || loading}
                onClick={() => handleCatalogPdf("screen")}
                className="cursor-pointer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-medium text-white bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="PDF of the list you see now (category + search)"
              >
                {catalogPdfBusy === "screen" ? (
                  <span className="animate-pulse">PDF…</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    PDF — this list
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!!catalogPdfBusy}
                onClick={() => handleCatalogPdf("full")}
                className="cursor-pointer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-medium border border-[#25D366] text-[#128C7E] bg-white hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Full catalog (all categories). Offline uses cache."
              >
                {catalogPdfBusy === "full" ? (
                  <span className="animate-pulse">Loading…</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    PDF — all products
                  </>
                )}
              </button>
              </div>
            </div>
          </div>
          {catalogPdfError && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm">
              {catalogPdfError}
            </div>
          )}
          {loading && products.length > 0 && (
            <p className="mt-2 text-xs text-gray-500" role="status">
              Updating list…
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}
        {cartApiError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {cartApiError}
          </div>
        )}

        {loading && products.length === 0 && (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        )}

        {/* Grid columns: preference 1–6; mobile max 2, tablet max 4, desktop max 6 */}
        <div className="flex flex-wrap items-center gap-2 justify-end mb-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-200 text-gray-700"
            aria-hidden
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
            </svg>
          </span>
          <label className="sr-only" htmlFor="product-grid-cols">
            Columns per row
          </label>
          <select
            id="product-grid-cols"
            value={gridColsPreference}
            onChange={(e) => setGridColsPreference(Number(e.target.value))}
            className="h-10 min-w-[7.5rem] cursor-pointer rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Columns per row"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} column{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          {effectiveGridCols !== gridColsPreference && (
            <span className="text-xs text-amber-800 sm:text-sm">
              Showing {effectiveGridCols} (max {maxColsForScreen} on this screen)
            </span>
          )}
        </div>

        {/* Products Grid — keep showing previous rows while a newer fetch runs (avoids empty screen on mobile scroll/refetch). */}
        {(!loading || products.length > 0) && (
          <div
            className="grid items-start gap-6"
            style={{
              gridTemplateColumns: `repeat(${effectiveGridCols}, minmax(0, 1fr))`,
            }}
          >
          {filteredProducts.map((product) => {
            const quantity = productQuantities[product.id] || 0;
            const maxStock = product.inStock ? Math.max(0, Number(product.stock) || 0) : 0;
            const atStockCap = product.inStock && maxStock > 0 && quantity >= maxStock;
            const hasQuantity = quantity > 0;
            const isEditingPrice = editingPrice === product.id;
            const currentPrice = editablePrices[product.id] || Number(String(product.price ?? "").replace(/[^\d.-]/g, "") || 0).toFixed(2);

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Product Image */}
                <div className="relative w-full pb-[100%] bg-white border-b border-gray-200 overflow-hidden shrink-0">
                  {!product.inStock && (
                    <span
                      className="absolute top-2 left-2 z-10 rounded-md bg-red-600 text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-1 shadow-md pointer-events-none"
                      aria-label="Out of stock"
                    >
                      Out of stock
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={product.image || DEFAULT_PRODUCT_IMAGE}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 flex flex-col flex-1 pb-2">

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-lg p-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product, -QTY_BUTTON_STEP)}
                      className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={formatQty(quantity)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw === "" ? 0 : Number(raw);
                        const value = Number.isFinite(parsed) ? Math.max(0, round2(parsed)) : 0;
                        const maxQ = product.inStock ? Math.max(0, Number(product.stock) || 0) : 0;
                        if (product.inStock && maxQ > 0 && value > maxQ) {
                          setCartApiError(INSUFFICIENT_STOCK_INCREASE_MSG);
                        }
                        const capped =
                          product.inStock && maxQ > 0 ? Math.min(Math.max(0, value), maxQ) : Math.max(0, value);
                        setProductQuantities((prev) => ({
                          ...prev,
                          [product.id]: round2(capped),
                        }));
                      }}
                      className="text-lg font-semibold text-gray-900 w-24 text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      min="0"
                      max={product.inStock && maxStock > 0 ? maxStock : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(product, QTY_BUTTON_STEP)}
                      disabled={!product.inStock || atStockCap}
                      title={
                        !product.inStock
                          ? "Out of stock"
                          : atStockCap
                            ? INSUFFICIENT_STOCK_INCREASE_MSG
                            : "Increase quantity"
                      }
                      className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {/* Action Button */}
                  <div className="mb-2">
                    {hasQuantity ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateCart(product)}
                        disabled={
                          cartApiLoadingId === product.id ||
                          (quantity > 0 && !product.inStock)
                        }
                        title={
                          quantity > 0 && !product.inStock
                            ? "Reduce quantity to zero or remove — out of stock"
                            : undefined
                        }
                        className="cursor-pointer w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {cartApiLoadingId === product.id ? "Updating..." : "Update Cart"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          quantity <= 0 ||
                          !product.inStock ||
                          cartApiLoadingId === product.id
                        }
                        title={!product.inStock ? "Out of stock" : undefined}
                        className="cursor-pointer w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {cartApiLoadingId === product.id ? "Adding..." : "Add to Cart"}
                      </button>
                    )}
                  </div>

                  {/* Toggle Rest of Details Button */}
                  <button
                    onClick={() => setExpandedProducts(prev => ({ ...prev, [product.id]: !prev[product.id] }))}
                    className="cursor-pointer flex justify-center items-center pt-3 pb-1 w-full text-gray-500 hover:text-gray-700 transition"
                  >
                    <span className="text-sm mr-1">{expandedProducts[product.id] ? "Hide Details" : "Show Details"}</span>
                    <svg className={`w-5 h-5 transform transition-transform ${expandedProducts[product.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${expandedProducts[product.id] ? 'max-h-[1000px] opacity-100 mt-1 border-t border-gray-100 pt-3' : 'max-h-0 opacity-0'}`}>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3 mt-1">
                      <span className="text-xl font-bold text-blue-600">
                        £{Number(currentPrice || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-1">
                      {product.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Stock: {product.stock} units available
                    </p>

                    {/* Unit Price */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Unit Price</p>
                      <div className="flex items-center justify-between">
                        {isEditingPrice ? (
                          <div className="flex items-center border-b-2 border-blue-500">
                            <span className="text-lg font-bold text-gray-900 pr-1">£</span>
                            <input
                              type="text"
                              value={currentPrice}
                              onChange={(e) =>
                                handlePriceEdit(
                                  product.id,
                                  e.target.value.replace(/[^\d.]/g, ""),
                                )
                              }
                              onBlur={() => setEditingPrice(null)}
                              className="text-lg font-bold text-gray-900 focus:outline-none w-20"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">
                            £{Number(currentPrice || 0).toFixed(2)}
                          </p>
                        )}
                        <button
                          onClick={() => togglePriceEdit(product.id)}
                          className="cursor-pointer text-xs text-gray-400 hover:text-blue-600"
                        >
                          Tap to edit
                        </button>
                      </div>
                    </div>

                    {/* Unit of Measure – API UOM_OPTIONS + default UOM */}
                    <div className="mb-3">
                      <Dropdown
                        label="Unit of Measure"
                        labelClassName="block text-sm font-medium text-gray-700 mb-1"
                        name={`unit-${product.id}`}
                        {...uomSelectModel(product, selectedUnits[product.id])}
                        onChange={(e) =>
                          setSelectedUnits((prev) => ({ ...prev, [product.id]: e.target.value }))
                        }
                      />
                    </div>

                    {/* Batch No – BATCH_EXPIRY (batch + exp) or BATCH_NOS */}
                    <div className="mb-3">
                      <Dropdown
                        label={`Batch No${batchIsMandatoryForProduct(product) ? " *" : ""}`}
                        labelClassName="block text-sm font-medium text-gray-700 mb-1"
                        name={`batch-${product.id}`}
                        {...batchSelectModel(product, selectedBatches[product.id])}
                        onChange={(e) =>
                          setSelectedBatches((prev) => ({ ...prev, [product.id]: e.target.value }))
                        }
                        disabled={
                          !(
                            (Array.isArray(product.batchExpiryList) && product.batchExpiryList.length > 0) ||
                            (Array.isArray(product.batchNumbers) && product.batchNumbers.length > 0)
                          )
                        }
                      />
                      {batchIsMandatoryForProduct(product) &&
                        !batchIsSelected(batchSelectModel(product, selectedBatches[product.id]).value) && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Batch No is required to add this product.
                        </p>
                      )}
                    </div>

                    {/* Comments/Remarks – API me comments bhejte hain */}
                    <div className="mb-1">
                      <p className="text-xs text-gray-400 mb-1">Comments / Remarks</p>
                      <textarea
                        placeholder="Add remark if any..."
                        rows={2}
                        value={productComments[product.id] ?? ""}
                        onChange={(e) => setProductComments((prev) => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm text-gray-600 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      {/* Back to top — bottom left */}
      {showScrollTop && (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 left-4 sm:left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Total products (listing) — bottom right, above Checkout */}
      <div
        className="fixed bottom-28 right-6 z-40 max-w-[min(90vw,14rem)] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-right shadow-md backdrop-blur-sm"
        aria-live="polite"
      >
        {loading && products.length === 0 ? (
          <span className="text-sm text-gray-500">Loading products…</span>
        ) : (
          <span className="text-sm font-medium text-gray-700">
            {filteredProducts.length.toLocaleString()} {filteredProducts.length === 1 ? "product" : "products"}
            {activeCategory !== "All Items" && (
              <span className="block text-xs font-normal text-gray-500 truncate" title={activeCategory}>
                in {activeCategory}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Fixed Checkout Button */}
      <button
        onClick={() => router.push('/cart')}
        disabled={isCartEmpty}
        className={`fixed bottom-14 right-6 px-6 py-3 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 ${isCartEmpty
          ? 'bg-blue-300 text-gray-900 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Checkout {!isCartEmpty && `(${formatQty(getTotalCartItems())})`}
      </button>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="text-center py-12 text-gray-500">Loading...</div>
          </main>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

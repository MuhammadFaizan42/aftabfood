"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getOrderSummary, updateCartItem, removeCartItem, addToCart } from "@/services/shetApi";
import { getCartTrnsId, getSaleOrderPartyCode, setCartTrnsId, clearCartTrnsId, isCartEditMode } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { getOfflineCart, getOfflineCartSync, getOfflineCartSyncForCustomer, getOfflineCartForCustomer, updateOfflineCartItem, removeFromOfflineCart, clearOfflineCart, clearOfflineCartIfCustomerMismatch, offlineCartCustomerMatches, normalizeOfflineCartCustomerId } from "@/lib/offline/offlineCart";
import {
  getCachedOrderDetail,
  getAllProductsSnapshot,
  getCachedCustomerDashboard,
  generateOfflineOrderId,
  saveOfflineOrderToExistingOrders,
  updateOfflineOrderInStores,
  mergeOfflineOrderDetailWithOfflineCart,
  hydrateOfflineCartFromOfflineOrder,
  syncOfflineCartWithMergedOrderItems,
  syncOfflineCartWithOrderItems,
  deleteOfflineOrder,
} from "@/lib/offline/bootstrapLoader";
import {
  DEFAULT_IMG,
  enrichOrderLinesWithImages,
  buildProductImageByIdMap,
  buildProductRowsMap,
  pickImageFromCachedProduct,
  pickImageFromOrderLine,
  resolveProductImageUrl,
} from "@/lib/productImage";
import { INSUFFICIENT_STOCK_INCREASE_MSG } from "@/lib/stockMessages";
import {
  formatCartStockBlockMessage,
  validateCartLinesAgainstProductSnapshot,
  getDisplayStockForProductRaw,
  findRawProductForCartLine,
} from "@/lib/cartSubmitStockValidation";

const QTY_STEP = 1;
/** Debounce for server cart `updateCartItem` / price `rate` saves while typing or clicking +/- */
const API_SAVE_DEBOUNCE_MS = 2000;
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function formatQty(n) {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v.toFixed(0)) : String(round2(v));
}

/**
 * Compute UOM-aware display stock per row (in the row’s selected UOM).
 * The catalog stores STOCK in the primary UOM; for a secondary UOM the
 * effective stock is STOCK × CON_RATE (mirrors product listing logic).
 * Without this, mixing a secondary-UOM line qty with a primary-UOM stock
 * would cap quantities incorrectly.
 */
function attachUomAwareDisplayStock(rows, products) {
  if (!rows?.length || !products?.length) return rows;
  return rows.map((row) => {
    const p = findRawProductForCartLine(row, products);
    if (!p) return row;
    const lineUom = String(row.uom ?? row.UOM ?? "").trim();
    const displayStock = getDisplayStockForProductRaw(p, lineUom);
    return {
      ...row,
      displayStock,
      inStock: displayStock > 0 ? true : row.inStock ?? displayStock > 0,
    };
  });
}

async function finalizeCartRows(rows, preloadedProducts = null, hydrateFromApi = true) {
  if (!rows?.length) return rows;
  let products = preloadedProducts;
  if (products == null) {
    products = await getAllProductsSnapshot();
  }
  try {
    const enriched = await enrichOrderLinesWithImages(rows, products, { hydrateFromApi });
    return attachUomAwareDisplayStock(enriched, products);
  } catch {
    return attachUomAwareDisplayStock(rows, products);
  }
}

function formatPrice(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toFixed(2)}`;
}

/**
 * Max orderable qty for a cart row; null = unknown (do not cap in UI).
 *
 * 1) UOM-aware: prefer `row.displayStock` (STOCK scaled to the line’s UOM) over raw `stock`.
 * 2) Ceiling = catalog cap (same number as product listing). Line qty must never exceed it.
 * 3) If snapshot shows 0 free but the line still has qty (e.g. submitted order / deducted cache),
 *    allow staying at that qty so the user is not stuck; `+` still cannot go above the cap when cap > 0.
 */
function maxQtyFromCartRow(item) {
  if (item == null) return null;
  const reserved = Math.max(0, Number(item.quantity) || 0);

  let cap = null;
  const uomAware = item.displayStock;
  if (uomAware != null && uomAware !== "") {
    const n = Number(uomAware);
    if (!Number.isNaN(n)) cap = Math.max(0, n);
  }
  if (cap == null && item.stock != null && item.stock !== "") {
    const n = Number(item.stock);
    if (!Number.isNaN(n)) cap = Math.max(0, n);
  }
  if (cap == null) {
    if (item.inStock === false && reserved <= 0) return 0;
    return null;
  }

  if (reserved > cap) return cap;
  if (cap <= 0 && reserved > 0) return reserved;
  return cap;
}

/** True only when there is no stock (in the line’s UOM) AND nothing reserved by this order. */
function rowIsTrulyOutOfStock(row) {
  if (row == null) return false;
  const reserved = Math.max(0, Number(row.quantity) || 0);
  if (reserved > 0) return false;
  if (row.displayStock != null && row.displayStock !== "") {
    const n = Number(row.displayStock);
    if (!Number.isNaN(n)) return n <= 0;
  }
  if (row.inStock === false) return true;
  if (row.stock != null && row.stock !== "") {
    const n = Number(row.stock);
    if (!Number.isNaN(n) && n <= 0) return true;
  }
  return false;
}

function deriveUnitPriceFromSummaryLine(r) {
  const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
  const total = Number(r.line_total ?? r.total ?? r.LC_AMT ?? 0) || 0;
  let up = Number(r.unit_price ?? r.UNIT_PRICE ?? r.price ?? r.ITEM_RATE ?? 0) || 0;
  if (up <= 0 && qty > 0 && total > 0) up = total / qty;
  return up;
}

/** Normalize order_summary API response to rows + totals */
function mapOrderSummary(res) {
  if (!res?.success || !res?.data) return { rows: [], subtotal: 0, tax: 0, discount: 0, grandTotal: 0 };
  const d = res.data;
  const rawItems = d.items ?? d.lines ?? d.cart ?? d.order_items ?? d.line_items ?? d.data?.items ?? d.data?.lines ?? (Array.isArray(d) ? d : []);
  const rows = (Array.isArray(rawItems) ? rawItems : []).map((r, index) => {
    // Align with getOrderLineItems — never use tl_id as product id (breaks stock match on edit).
    const rawItemId =
      r.item_id ??
      r.product_id ??
      r.PRODUCT_ID ??
      r.ITEM_CODE ??
      r.CODE ??
      r.sku ??
      r.SKU ??
      r.PROD_ID ??
      r.product_code ??
      r.PART_NO ??
      r.PK_INV_ID ??
      r.id ??
      r.product?.id ??
      r.product?.product_id ??
      r.product?.code ??
      r.product?.PRODUCT_ID ??
      r.INV_ITEM_ID ??
      r.ITEM_ID ??
      r.PK_ID ??
      "";
    const fromProductFields = String(rawItemId ?? "").trim();
    const tlId = r.tl_id ?? r.TL_ID ?? r.line_id ?? r.LINE_ID ?? null;
    const name = r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—";
    const skuFromLine = String(
      r.sku ??
        r.SKU ??
        r.PRODUCT_ID ??
        r.product_id ??
        r.ITEM_CODE ??
        r.CODE ??
        r.PROD_ID ??
        r.PART_NO ??
        r.PK_INV_ID ??
        (fromProductFields || "") ??
        "—",
    ).trim();
    const sku = skuFromLine && skuFromLine !== "" ? skuFromLine : "—";
    const uom = String(r.uom ?? r.UOM ?? r.unit_of_measure ?? r.UNIT_OF_MEASURE ?? "").trim();
    const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
    const unitPrice = deriveUnitPriceFromSummaryLine(r);
    const lineTotal = Number(r.line_total ?? r.total ?? r.LC_AMT ?? unitPrice * qty) || 0;
    const rawImg = pickImageFromOrderLine(r);
    const img = rawImg ? resolveProductImageUrl(rawImg) : "";
    const id = tlId ?? (fromProductFields || skuFromLine || `line-${index}`);
    const apiId =
      fromProductFields ||
      (sku && sku !== "—" ? sku : null);
    return {
      id,
      itemIdForApi: apiId,
      tlId: tlId != null && tlId !== "" ? tlId : null,
      name,
      sku,
      uom,
      quantity: qty,
      price: unitPrice,
      lineTotal,
      image: img || DEFAULT_IMG,
    };
  });
  const subtotal = Number(d.subtotal ?? d.sub_total ?? 0) || rows.reduce((s, r) => s + r.lineTotal, 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal = Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  return { rows, subtotal, tax, discount, grandTotal };
}

/** Map offline cart to table rows */
function mapOfflineCartToRows(cart, products = []) {
  if (!cart?.items?.length) return { rows: [], subtotal: 0, tax: 0, discount: 0, grandTotal: 0 };
  const prodMap = buildProductRowsMap(products);
  const imgMap = buildProductImageByIdMap(products);
  let subtotal = 0;
  const rows = cart.items.map((it) => {
    const lt = (Number(it.unit_price) || 0) * (Number(it.qty) || 0);
    subtotal += lt;
    const keys = [it.item_id, it.product_id, it.sku, it.product_key]
      .filter((x) => x != null && x !== "")
      .map((x) => String(x).trim());
    let p = null;
    for (const k of keys) {
      if (prodMap.has(k)) {
        p = prodMap.get(k);
        break;
      }
    }
    const savedUrl = it.image_url ?? it.IMAGE_URL;
    let image = DEFAULT_IMG;
    if (savedUrl && String(savedUrl).trim()) {
      image = resolveProductImageUrl(String(savedUrl).trim());
    } else {
      for (const k of keys) {
        if (imgMap.has(k)) {
          image = imgMap.get(k);
          break;
        }
      }
      if (image === DEFAULT_IMG && p) {
        const raw = pickImageFromCachedProduct(p);
        if (raw) image = resolveProductImageUrl(raw) || DEFAULT_IMG;
      }
    }
    const stockRaw = p ? (p.STOCK ?? p.QTY ?? p.stock) : null;
    const stockNum = stockRaw != null && stockRaw !== "" ? Number(stockRaw) : NaN;
    const stock = !Number.isNaN(stockNum) ? stockNum : undefined;
    const inStock = stock !== undefined ? stock > 0 : undefined;
    return {
      id: it.item_id ?? it.product_id,
      itemIdForApi: it.item_id ?? it.product_id,
      tlId: null,
      name: it.product_name ?? p?.PRODUCT_NAME ?? p?.name ?? "—",
      sku: it.sku ?? it.item_id ?? "—",
      uom: String(it.uom ?? p?.UOM ?? p?.uom ?? "").trim(),
      comments: String(it.comments ?? "").trim(),
      batch_no: String(it.batch_no ?? it.BATCH_NO ?? "").trim(),
      exp_date: String(it.exp_date ?? it.EXP_DATE ?? it.expiry_date ?? "").trim(),
      quantity: Number(it.qty) || 0,
      price: Number(it.unit_price) || 0,
      lineTotal: lt,
      image,
      ...(stock !== undefined ? { stock, inStock } : {}),
    };
  });
  return { rows, subtotal, tax: 0, discount: 0, grandTotal: subtotal };
}

async function convertOfflineCartToServerDraft(cart, customerId) {
  const cid = String(customerId || "").trim();
  if (!cid) throw new Error("Customer (party) is missing for server sync.");
  if (!cart?.items?.length) throw new Error("Offline cart is empty.");
  let serverTrns = null;
  for (const it of cart.items) {
    const itemId = it.item_id ?? it.product_id ?? it.sku ?? it.id;
    if (!itemId) continue;
    const qty = Number(it.qty ?? it.quantity ?? 0) || 0;
    let unit_price = Number(it.unit_price ?? it.unitPrice ?? 0) || 0;
    if (unit_price <= 0 && qty > 0) {
      const lt = Number(it.line_total ?? it.lineTotal ?? 0) || 0;
      if (lt > 0) unit_price = lt / qty;
    }
    const res = await addToCart(cid, String(itemId), qty, serverTrns, {
      unit_price,
      uom: it.uom ?? "",
      comments: it.comments ?? "",
      batch_no: it.batch_no ?? "",
      exp_date: it.exp_date ?? it.expiry_date ?? "",
    });
    if (res && typeof res === "object" && res.success === false) {
      throw new Error(res.message || "Add to cart failed.");
    }
    const next = res?.data?.trns_id ?? res?.trns_id;
    if (next != null && next !== "") serverTrns = next;
  }
  if (serverTrns == null || serverTrns === "") {
    throw new Error("Could not create a server draft from this offline cart.");
  }
  return serverTrns;
}

export default function Cart() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [hasMounted, setHasMounted] = useState(false);
  const [trnsId, setTrnsId] = useState(null);
  const [isOfflineCart, setIsOfflineCart] = useState(false);
  const [isCachedOrderReadOnly, setIsCachedOrderReadOnly] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [reviewNavigationSaving, setReviewNavigationSaving] = useState(false);
  const priceSaveTimersRef = useRef({});
  const qtyPersistTimersRef = useRef({});
  const pendingQtyByIdRef = useRef({});
  const cartItemsRef = useRef([]);
  const trnsIdRef = useRef(null);
  const isOfflineCartRef = useRef(false);
  const partyCodeForBack = getSaleOrderPartyCode();
  const trnsIdForBack = getCartTrnsId();
  const backToProductsHref = partyCodeForBack
    ? `/products?party_code=${encodeURIComponent(String(partyCodeForBack))}${trnsIdForBack ? `&trns_id=${encodeURIComponent(String(trnsIdForBack))}` : ""}`
    : "/products";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    trnsIdRef.current = trnsId;
  }, [trnsId]);

  useEffect(() => {
    isOfflineCartRef.current = isOfflineCart;
  }, [isOfflineCart]);

  useEffect(() => {
    try {
      if (typeof sessionStorage === "undefined") return;
      const msg = sessionStorage.getItem("aftab_cart_flash");
      if (msg && String(msg).trim()) {
        setInfoMessage(String(msg));
        sessionStorage.removeItem("aftab_cart_flash");
        setTimeout(() => setInfoMessage(null), 20000);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadSummary = useCallback(async () => {
    const id = getCartTrnsId();
    setLoading(true);
    setError(null);
    try {
      if (id && String(id).startsWith("offline_")) {
        const cached = await getCachedOrderDetail(id);
        if (cached) {
          const orderCustomer =
            cached.customer?.SHORT_CODE ??
            cached.customer?.PARTY_CODE ??
            cached.customer?.party_code ??
            cached.customer_id ??
            getSaleOrderPartyCode();
          await clearOfflineCartIfCustomerMismatch(orderCustomer);
          let cart = await getOfflineCart();
          const orderCust = normalizeOfflineCartCustomerId(orderCustomer);
          if (
            cart.items.length &&
            orderCust &&
            !offlineCartCustomerMatches(cart.customer_id, orderCust)
          ) {
            await clearOfflineCart();
            cart = await getOfflineCart();
          }
          if ((!cart?.items?.length) && Array.isArray(cached.items) && cached.items.length > 0) {
            await hydrateOfflineCartFromOfflineOrder(id, cached);
            cart = await getOfflineCart();
          }
          const merged = mergeOfflineOrderDetailWithOfflineCart(cached, cart);
          try {
            await updateOfflineOrderInStores(id, {
              items: merged.items,
              grandTotal: merged.grand_total,
            });
          } catch {
            /* ignore */
          }
          const party =
            merged.customer?.SHORT_CODE ??
            merged.customer?.PARTY_CODE ??
            merged.customer?.party_code ??
            getSaleOrderPartyCode();
          try {
            await syncOfflineCartWithMergedOrderItems(party, merged.items);
          } catch {
            /* ignore */
          }

          // Manual sync only: do not auto-convert offline orders on reconnect.

          setTrnsId(id);
          setIsOfflineCart(true);
          setIsCachedOrderReadOnly(false);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary({
            success: true,
            data: merged,
          });
          setCartItems(await finalizeCartRows(rows, null, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
      }

      if (id && !String(id).startsWith("offline_")) {
        const maxAttempts = isOnline ? 3 : 1;
        let summaryRes = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const res = await getOrderSummary(id);
            if (res?.success && res?.data) {
              summaryRes = res;
              break;
            }
            break;
          } catch {
            if (attempt < maxAttempts - 1 && isOnline) {
              await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
              continue;
            }
            break;
          }
        }
        if (summaryRes) {
          setTrnsId(id);
          setIsOfflineCart(false);
          setIsCachedOrderReadOnly(false);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary(summaryRes);
          setCartItems(await finalizeCartRows(rows, null, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
        const cachedAfterSummaryFail = await getCachedOrderDetail(id);
        if (cachedAfterSummaryFail) {
          setTrnsId(id);
          setIsOfflineCart(false);
          setIsCachedOrderReadOnly(!isOnline);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary({
            success: true,
            data: cachedAfterSummaryFail,
          });
          setCartItems(await finalizeCartRows(rows, null, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
      }

      const partyCode = String(getSaleOrderPartyCode() ?? "").trim();
      await clearOfflineCartIfCustomerMismatch(partyCode);

      const syncCart = getOfflineCartSyncForCustomer(partyCode);
      if (syncCart?.items?.length) {
        setTrnsId(null);
        setIsOfflineCart(true);
        setIsCachedOrderReadOnly(false);
        const products = await getAllProductsSnapshot();
        const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOfflineCartToRows(syncCart, products);
        setCartItems(await finalizeCartRows(rows, products));
        setSubtotal(st);
        setTax(t);
        setDiscount(d);
        setGrandTotal(gt);
        return;
      }
      let cart = await getOfflineCartForCustomer(partyCode);
      if (!cart?.items?.length) {
        await new Promise((r) => setTimeout(r, 300));
        cart = await getOfflineCartForCustomer(partyCode);
      }
      if (cart?.items?.length) {
        setTrnsId(null);
        setIsOfflineCart(true);
        setIsCachedOrderReadOnly(false);
        const products = await getAllProductsSnapshot();
        const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOfflineCartToRows(cart, products);
        setCartItems(await finalizeCartRows(rows, products));
        setSubtotal(st);
        setTax(t);
        setDiscount(d);
        setGrandTotal(gt);
        return;
      }

      if (id) {
        const cached = await getCachedOrderDetail(id);
        if (cached) {
          setTrnsId(id);
          setIsOfflineCart(false);
          setIsCachedOrderReadOnly(!isOnline);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary({ success: true, data: cached });
          setCartItems(await finalizeCartRows(rows));
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
      }

      setTrnsId(id ?? null);
      setIsOfflineCart(!id);
      setIsCachedOrderReadOnly(false);
      setCartItems([]);
      setSubtotal(0);
      setTax(0);
      setDiscount(0);
      setGrandTotal(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order summary.");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (hasMounted) loadSummary();
  }, [hasMounted, loadSummary]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") loadSummary();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loadSummary]);

  const applyQtyLocally = (id, newQty) => {
    const q = Math.max(0, round2(newQty));
    setQtyDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCartItems((prev) => {
      const newRows =
        q === 0
          ? prev.filter((r) => r.id !== id)
          : prev.map((r) => (r.id === id ? { ...r, quantity: q, lineTotal: round2(r.price * q) } : r));
      const newSubtotal = newRows.reduce((s, r) => s + (r.lineTotal ?? 0), 0);
      setSubtotal(newSubtotal);
      setTax(0);
      setDiscount(0);
      setGrandTotal(newSubtotal);
      return newRows;
    });
  };

  const persistQtyToApi = async (id, newQty, resolvedMeta = null) => {
    const tid = trnsIdRef.current;
    if (!tid || String(tid).startsWith("offline_") || isOfflineCartRef.current) return;
    const q = Math.max(0, round2(newQty));
    if (q <= 0) return;

    let validId;
    let tlId = null;
    if (resolvedMeta?.validId) {
      validId = resolvedMeta.validId;
      tlId = resolvedMeta.tlId ?? null;
    } else {
      const it = cartItemsRef.current.find((i) => i.id === id);
      if (!it) return;
      const candidate = (it.itemIdForApi ?? it.sku ?? it.id)?.toString?.() ?? "";
      validId = candidate && candidate !== "—" ? candidate : String(it.id ?? "");
      tlId = it.tlId;
    }
    if (!validId) return;

    setActionLoading(id);
    setError(null);
    try {
      await updateCartItem(
        tid,
        validId,
        q,
        tlId != null && tlId !== "" ? { tl_id: tlId } : {},
      );
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cart.");
      try {
        await loadSummary();
      } catch {
        /* ignore */
      }
    } finally {
      setActionLoading(null);
    }
  };

  const scheduleQtyPersist = (id, newQty) => {
    const q = Math.max(0, round2(newQty));
    if (q <= 0) return;
    pendingQtyByIdRef.current[id] = q;
    if (qtyPersistTimersRef.current[id]) {
      clearTimeout(qtyPersistTimersRef.current[id]);
    }
    qtyPersistTimersRef.current[id] = setTimeout(() => {
      delete qtyPersistTimersRef.current[id];
      const pending = pendingQtyByIdRef.current[id];
      delete pendingQtyByIdRef.current[id];
      if (pending !== undefined) {
        void persistQtyToApi(id, pending);
      }
    }, API_SAVE_DEBOUNCE_MS);
  };

  async function flushPendingQtyChanges() {
    Object.values(qtyPersistTimersRef.current).forEach((t) => clearTimeout(t));
    qtyPersistTimersRef.current = {};
    const pending = { ...pendingQtyByIdRef.current };
    pendingQtyByIdRef.current = {};
    for (const [rowId, q] of Object.entries(pending)) {
      if (q > 0) {
        await persistQtyToApi(rowId, q);
      }
    }
  }

  async function flushPendingPriceChanges() {
    await flushPendingQtyChanges();
    const entries = Object.entries(priceDrafts);
    if (!entries.length) return;

    Object.values(priceSaveTimersRef.current).forEach((timer) => clearTimeout(timer));
    priceSaveTimersRef.current = {};

    const saves = entries
      .map(([id, draft]) => {
        const num = Number(draft);
        if (!Number.isFinite(num) || num < 0) return null;
        return persistPrice(id, Number(num.toFixed(2)), {
          force: true,
          throwOnError: true,
        });
      })
      .filter(Boolean);

    if (saves.length) await Promise.all(saves);
  }

  const handleContinueToReview = useCallback(async () => {
    setError(null);
    const online = Boolean(isOnline);
    if (online) {
      if (!isCartEditMode()) {
        try {
          const products = await getAllProductsSnapshot();
          const lineRows = (cartItems || []).map((r) => ({
            itemIdForApi: r.itemIdForApi,
            id: r.id,
            sku: r.sku,
            name: r.name,
            quantity: r.quantity,
            uom: r.uom,
          }));
          const stockIssues = validateCartLinesAgainstProductSnapshot(
            lineRows,
            products,
            { skipWhenProductMissing: false },
          );
          if (stockIssues.length > 0) {
            setError(formatCartStockBlockMessage(stockIssues));
            return;
          }
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Could not verify product stock. Try again.",
          );
          return;
        }
      }
      setReviewNavigationSaving(true);
      try {
        await flushPendingPriceChanges();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not save cart changes. Try again.",
        );
        setReviewNavigationSaving(false);
        return;
      }
      setReviewNavigationSaving(false);
      router.push("/review");
      return;
    }

    // OFFLINE: ensure we have an offline_* order persisted so it shows in Existing Orders.
    const existingId = getCartTrnsId();
    if (existingId && String(existingId).startsWith("offline_")) {
      router.push("/review");
      return;
    }
    try {
      const cart = await getOfflineCart();
      if (!cart?.items?.length) {
        router.push("/review");
        return;
      }
      const orderId = generateOfflineOrderId();
      setCartTrnsId(orderId);

      const partyFallback = String(getSaleOrderPartyCode() ?? "").trim();
      const customerIdForSave = String(cart.customer_id ?? partyFallback ?? "").trim();
      const dash = cart.customer_id ? await getCachedCustomerDashboard(cart.customer_id) : null;
      const cust = dash?.customer ?? {};
      const customer = {
        CUSTOMER_NAME: cust.CUSTOMER_NAME ?? cust.customer_name ?? "Offline order",
        SHORT_CODE: customerIdForSave || "",
        ADRES: [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—",
        pay_terms: cust.PAY_TERMS ?? cust.pay_terms ?? "—",
      };

      const itemsForSave = (Array.isArray(cartItems) ? cartItems : []).map((row) => ({
        item_id: String(row.itemIdForApi ?? row.sku ?? row.id ?? ""),
        product_id: String(row.itemIdForApi ?? row.sku ?? row.id ?? ""),
        product_name: row.name ?? "—",
        sku: row.sku ?? "",
        qty: Number(row.quantity ?? 0) || 0,
        unit_price: Number(row.price ?? 0) || 0,
        line_total: Number(row.lineTotal ?? 0) || 0,
        image: row.image ?? "",
        image_url: row.image ?? "",
        uom: row.uom ?? "",
        comments: row.comments ?? "",
        batch_no: row.batch_no ?? "",
        exp_date: row.exp_date ?? "",
      })).filter((it) => it.item_id && it.qty > 0);

      const st = itemsForSave.reduce((s, it) => s + (Number(it.line_total) || (Number(it.unit_price) || 0) * (Number(it.qty) || 0)), 0);
      await saveOfflineOrderToExistingOrders({
        customer,
        items: itemsForSave,
        subtotal: st,
        tax: 0,
        discount: 0,
        grandTotal: st,
        customer_id: customerIdForSave || null,
        delivery_date: "",
        pay_terms: "",
        discount_val: "",
        remarks: "",
        orderId,
      });
    } catch (e) {
      // Still allow navigation; user can retry saving by opening Review offline.
      setError(e instanceof Error ? e.message : "Could not save offline order.");
    } finally {
      router.push("/review");
    }
  }, [cartItems, flushPendingPriceChanges, isOnline, router]);

  useEffect(() => {
    return () => {
      Object.values(priceSaveTimersRef.current).forEach((timer) => clearTimeout(timer));
      Object.values(qtyPersistTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const rowsToOrderItems = (rows) =>
    (rows || []).map((r) => ({
      id: r.itemIdForApi ?? r.id,
      name: r.name,
      sku: r.sku,
      unitPrice: r.price,
      quantity: r.quantity,
      total: r.lineTotal,
      image: r.image,
    }));

  const updateQuantity = async (id, increment) => {
    if (isCachedOrderReadOnly) return;
    if (isOfflineCart) {
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;
      if (increment > 0) {
        const maxQ = maxQtyFromCartRow(item);
        if (maxQ != null && item.quantity + increment > maxQ) {
          setError(INSUFFICIENT_STOCK_INCREASE_MSG);
          return;
        }
      }
      const newQty = Math.max(0, round2(item.quantity + increment));
      setActionLoading(id);
      setError(null);
      try {
        if (trnsId && String(trnsId).startsWith("offline_")) {
          const newRows =
            newQty === 0
              ? cartItems.filter((i) => i.id !== id)
              : cartItems.map((r) => (r.id === id ? { ...r, quantity: newQty, lineTotal: r.price * newQty } : r));
          const newSubtotal = newRows.reduce((s, r) => s + (r.lineTotal ?? 0), 0);
          setCartItems(newRows);
          setSubtotal(newSubtotal);
          setTax(0);
          setDiscount(0);
          setGrandTotal(newSubtotal);
          const payloadItems = rowsToOrderItems(newRows);
          await updateOfflineOrderInStores(trnsId, { items: payloadItems, grandTotal: newSubtotal });
          await syncOfflineCartWithOrderItems(getSaleOrderPartyCode(), payloadItems);
        } else {
          await updateOfflineCartItem(item.itemIdForApi ?? item.sku ?? id, newQty);
          await loadSummary();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update cart.");
      } finally {
        setActionLoading(null);
      }
      return;
    }
    if (!trnsId) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    if (increment > 0) {
      const maxQ = maxQtyFromCartRow(item);
      if (maxQ != null && item.quantity + increment > maxQ) {
        setError(INSUFFICIENT_STOCK_INCREASE_MSG);
        return;
      }
    }
    const newQty = Math.max(0, round2(item.quantity + increment));
    await handleQuantityChange(id, String(newQty));
  };

  const handleQuantityChange = async (id, value) => {
    const raw = value;
    const parsed = raw === "" ? 0 : Number(raw);
    const num = Number.isFinite(parsed) ? Math.max(0, round2(parsed)) : 0;
    if (!Number.isFinite(num) || num < 0) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const maxQ = maxQtyFromCartRow(item);
    if (maxQ != null && num > maxQ) {
      setError(INSUFFICIENT_STOCK_INCREASE_MSG);
      return;
    }
    const newQty = num === 0 ? 0 : num;
    if (newQty === item.quantity) return;

    if (isCachedOrderReadOnly) return;

    if (isOfflineCart) {
      await updateQuantity(id, newQty - item.quantity);
      return;
    }

    if (!trnsId) return;

    const candidate = (item.itemIdForApi ?? item.sku ?? item.id)?.toString?.() ?? "";
    const validId = candidate && candidate !== "—" ? candidate : String(item.id ?? "");
    if (!validId) return;

    const clearQtyTimerForRow = () => {
      if (qtyPersistTimersRef.current[id]) {
        clearTimeout(qtyPersistTimersRef.current[id]);
        delete qtyPersistTimersRef.current[id];
      }
      delete pendingQtyByIdRef.current[id];
    };

    if (newQty === 0) {
      clearQtyTimerForRow();
      setActionLoading(id);
      setError(null);
      try {
        await removeCartItem(trnsId, validId, item.tlId != null ? { tl_id: item.tlId } : {});
        await loadSummary();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update cart.");
      } finally {
        setActionLoading(null);
      }
      return;
    }

    applyQtyLocally(id, newQty);
    scheduleQtyPersist(id, newQty);
  };

  const handleQtyInputChange = (row, raw) => {
    // Allow intermediate states like "", "0.", "." while typing.
    const next = String(raw ?? "");
    if (!/^\d*\.?\d*$/.test(next)) return;
    setQtyDrafts((prev) => ({ ...prev, [row.id]: next }));
    // Only commit when it's a stable number (not empty, not just ".", not ending with ".")
    if (!next || next === "." || next.endsWith(".")) return;
    const parsed = Number(next);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    handleQuantityChange(row.id, String(round2(parsed)));
  };

  const commitQtyChange = async (row) => {
    const draft = qtyDrafts[row.id];
    if (draft == null) return;
    const s = String(draft).trim();
    if (!s || s === ".") {
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }
    const parsed = Number(s);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }
    const rounded = round2(parsed);
    const item = cartItems.find((i) => i.id === row.id);
    if (!item) {
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    const maxQ = maxQtyFromCartRow(item);
    if (maxQ != null && rounded > maxQ) {
      setError(INSUFFICIENT_STOCK_INCREASE_MSG);
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    if (rounded === item.quantity) {
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    if (isCachedOrderReadOnly) {
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    if (isOfflineCart || !trnsId) {
      await handleQuantityChange(row.id, String(rounded));
      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }

    if (qtyPersistTimersRef.current[row.id]) {
      clearTimeout(qtyPersistTimersRef.current[row.id]);
      delete qtyPersistTimersRef.current[row.id];
    }
    delete pendingQtyByIdRef.current[row.id];

    if (rounded === 0) {
      await handleQuantityChange(row.id, "0");
    } else {
      const candidate = (item.itemIdForApi ?? item.sku ?? item.id)?.toString?.() ?? "";
      const validId = candidate && candidate !== "—" ? candidate : String(item.id ?? "");
      applyQtyLocally(row.id, rounded);
      await persistQtyToApi(row.id, rounded, { validId, tlId: item.tlId });
    }
    setQtyDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
  };

  const applyPriceLocally = (id, nextPrice) => {
    setCartItems((prevRows) => {
      const newRows = prevRows.map((r) =>
        r.id === id ? { ...r, price: nextPrice, lineTotal: nextPrice * r.quantity } : r,
      );
      const newSubtotal = newRows.reduce((s, r) => s + (r.lineTotal ?? 0), 0);
      setSubtotal(newSubtotal);
      setTax(0);
      setDiscount(0);
      setGrandTotal(newSubtotal);
      return newRows;
    });
  };

  const persistPrice = async (id, nextPriceRaw, options = {}) => {
    const { force = false, throwOnError = false } = options;
    if (isCachedOrderReadOnly) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const parsed = Number(nextPriceRaw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const nextPrice = Number(parsed.toFixed(2));
    if (!force && nextPrice === Number(item.price)) return;

    if (isOfflineCart) {
      setActionLoading(id);
      setError(null);
      try {
        if (trnsId && String(trnsId).startsWith("offline_")) {
          const newRows = cartItems.map((r) =>
            r.id === id
              ? { ...r, price: nextPrice, lineTotal: nextPrice * r.quantity }
              : r,
          );
          const newSubtotal = newRows.reduce((s, r) => s + (r.lineTotal ?? 0), 0);
          setCartItems(newRows);
          setSubtotal(newSubtotal);
          setTax(0);
          setDiscount(0);
          setGrandTotal(newSubtotal);
          const payloadItems = rowsToOrderItems(newRows);
          await updateOfflineOrderInStores(trnsId, {
            items: payloadItems,
            grandTotal: newSubtotal,
          });
          await syncOfflineCartWithOrderItems(getSaleOrderPartyCode(), payloadItems);
        } else {
          await updateOfflineCartItem(item.itemIdForApi ?? item.sku ?? id, item.quantity, {
            unitPrice: nextPrice,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update price.");
        if (throwOnError) throw err;
      } finally {
        setActionLoading(null);
      }
      return;
    }

    if (!trnsId) return;
    const candidate = (item.itemIdForApi ?? item.sku ?? item.id)?.toString?.() ?? "";
    const validId = candidate && candidate !== "—" ? candidate : String(item.id ?? "");
    if (!validId) return;
    setActionLoading(id);
    setError(null);
    try {
      await updateCartItem(
        trnsId,
        validId,
        item.quantity,
        item.tlId != null ? { tl_id: item.tlId, rate: nextPrice } : { rate: nextPrice },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update price.");
      if (throwOnError) throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const schedulePricePersist = (id, nextPrice) => {
    if (priceSaveTimersRef.current[id]) {
      clearTimeout(priceSaveTimersRef.current[id]);
    }
    priceSaveTimersRef.current[id] = setTimeout(() => {
      persistPrice(id, nextPrice, { force: true });
      delete priceSaveTimersRef.current[id];
    }, API_SAVE_DEBOUNCE_MS);
  };

  const handlePriceInputChange = (row, value) => {
    const normalized = value.replace(/[^0-9.]/g, "");
    if (normalized.split(".").length > 2) return;
    setPriceDrafts((prev) => ({ ...prev, [row.id]: normalized }));
    const num = Number(normalized);
    if (!Number.isFinite(num) || num < 0) return;
    const nextPrice = Number(num.toFixed(2));
    applyPriceLocally(row.id, nextPrice);
    schedulePricePersist(row.id, nextPrice);
  };

  const commitPriceChange = async (row) => {
    if (priceSaveTimersRef.current[row.id]) {
      clearTimeout(priceSaveTimersRef.current[row.id]);
      delete priceSaveTimersRef.current[row.id];
    }
    const draft = priceDrafts[row.id];
    if (draft == null) return;
    const num = Number(draft);
    if (!Number.isFinite(num) || num < 0) {
      setPriceDrafts((prev) => ({ ...prev, [row.id]: row.price.toFixed(2) }));
      return;
    }
    const nextPrice = Number(num.toFixed(2));
    applyPriceLocally(row.id, nextPrice);
    await persistPrice(row.id, nextPrice, { force: true });
    setPriceDrafts((prev) => ({ ...prev, [row.id]: Number(num).toFixed(2) }));
  };

  const removeItem = async (id) => {
    if (isCachedOrderReadOnly) return;
    if (isOfflineCart) {
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;
      setActionLoading(id);
      setError(null);
      try {
        if (trnsId && String(trnsId).startsWith("offline_")) {
          const newRows = cartItems.filter((i) => i.id !== id);
          const newSubtotal = newRows.reduce((s, r) => s + (r.lineTotal ?? 0), 0);
          setCartItems(newRows);
          setSubtotal(newSubtotal);
          setTax(0);
          setDiscount(0);
          setGrandTotal(newSubtotal);
          const payloadItems = rowsToOrderItems(newRows);
          await updateOfflineOrderInStores(trnsId, { items: payloadItems, grandTotal: newSubtotal });
          await syncOfflineCartWithOrderItems(getSaleOrderPartyCode(), payloadItems);
        } else {
          await removeFromOfflineCart(item.itemIdForApi ?? item.sku ?? id);
          await loadSummary();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove item.");
      } finally {
        setActionLoading(null);
      }
      return;
    }
    if (!trnsId) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    if (qtyPersistTimersRef.current[id]) {
      clearTimeout(qtyPersistTimersRef.current[id]);
      delete qtyPersistTimersRef.current[id];
    }
    delete pendingQtyByIdRef.current[id];
    const candidate = (item.itemIdForApi ?? item.sku ?? item.id)?.toString?.() ?? "";
    const validId = candidate && candidate !== "—" ? candidate : String(item.id ?? "");
    if (!validId) return;
    setActionLoading(id);
    setError(null);
    try {
      await removeCartItem(trnsId, validId, item.tlId != null ? { tl_id: item.tlId } : {});
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const columns = [
    {
      header: "Product",
      accessor: "product",
      width: "36%",
      render: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={row.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_IMG;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 flex flex-wrap items-center gap-1">
              <span>{row.name}</span>
              {rowIsTrulyOutOfStock(row) && (
                <span className="inline-flex shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  OOS
                </span>
              )}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-500 truncate">UOM: {row.uom || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      width: "16%",
      render: (row) => (
        <div className="flex items-center border border-gray-300 rounded-md bg-white px-1 h-7 sm:h-8 max-w-[5.5rem]">
          <span className="text-gray-500 text-xs mr-0.5">£</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceDrafts[row.id] ?? Number(row.price || 0).toFixed(2)}
            onFocus={() =>
              setPriceDrafts((prev) => ({
                ...prev,
                [row.id]: prev[row.id] ?? Number(row.price || 0).toFixed(2),
              }))
            }
            onChange={(e) => handlePriceInputChange(row, e.target.value)}
            onBlur={() => commitPriceChange(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            disabled={isCachedOrderReadOnly}
            className="w-full min-w-0 text-xs sm:text-sm text-gray-900 font-medium bg-transparent border-none focus:outline-none disabled:text-gray-400"
          />
        </div>
      ),
    },
    {
      header: "Quantity",
      accessor: "quantity",
      width: "22%",
      render: (row) => {
        const maxQ = maxQtyFromCartRow(row);
        const atStockCap = maxQ != null && row.quantity >= maxQ;
        return (
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => updateQuantity(row.id, -QTY_STEP)}
            disabled={actionLoading === row.id || isCachedOrderReadOnly}
            className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min="0"
            max={maxQ != null ? maxQ : undefined}
            step="any"
            inputMode="decimal"
            value={qtyDrafts[row.id] ?? formatQty(row.quantity)}
            onFocus={() =>
              setQtyDrafts((prev) => ({
                ...prev,
                [row.id]: prev[row.id] ?? formatQty(row.quantity),
              }))
            }
            onChange={(e) => handleQtyInputChange(row, e.target.value)}
            onBlur={() => commitQtyChange(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            disabled={isCachedOrderReadOnly}
            className="w-10 sm:w-14 h-7 sm:h-8 text-center text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 px-0.5"
          />
          <button
            type="button"
            onClick={() => updateQuantity(row.id, QTY_STEP)}
            disabled={
              actionLoading === row.id ||
              isCachedOrderReadOnly ||
              atStockCap
            }
            title={atStockCap ? INSUFFICIENT_STOCK_INCREASE_MSG : "Increase quantity"}
            className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        );
      },
    },
    {
      header: "Total",
      accessor: "total",
      width: "16%",
      render: (row) => (
        <div className="font-semibold text-gray-900 text-xs sm:text-sm tabular-nums">{formatPrice(row.lineTotal)}</div>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      width: "10%",
      render: (row) => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => removeItem(row.id)}
            disabled={actionLoading === row.id || isCachedOrderReadOnly}
            className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // If user is editing an existing draft order (has `trnsId`), we still show
  // the Order Summary UI even when there are 0 items yet.
  const emptyCart = !trnsId && cartItems.length === 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href={backToProductsHref}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
          {trnsId && <span className="text-sm text-gray-500">Order #{trnsId}</span>}
          {!isOnline && <span className="text-sm text-amber-600 font-medium">Offline – will sync when online</span>}
          {isCachedOrderReadOnly && (
            <span className="text-sm text-amber-600">View only – connect online to edit</span>
          )}
        </div>

        {infoMessage && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-900 text-sm mb-4 flex items-start justify-between gap-2">
            <span className="whitespace-pre-line">{infoMessage}</span>
            <button
              type="button"
              onClick={() => setInfoMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-medium shrink-0"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6 whitespace-pre-line">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading order summary...</div>
        ) : emptyCart ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">Your cart is empty. Add products from the product listing.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <ReusableTable columns={columns} data={cartItems} showPagination={false} variant="fluid" />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal (Qty {formatQty(totalItems)})</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {/* <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                  </div> */}
                </div>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContinueToReview}
                  disabled={reviewNavigationSaving || Boolean(actionLoading)}
                  className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {reviewNavigationSaving ? "Saving changes..." : "Continue to Review"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

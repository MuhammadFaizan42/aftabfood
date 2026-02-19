"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getOrderSummary, updateCartItem, removeCartItem } from "@/services/shetApi";
import { getCartTrnsId, getSaleOrderPartyCode } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { getOfflineCart, getOfflineCartSync, updateOfflineCartItem, removeFromOfflineCart } from "@/lib/offline/offlineCart";
import { getCachedOrderDetail, updateOfflineOrderInStores } from "@/lib/offline/bootstrapLoader";
import { getAll } from "@/lib/idb";

const DEFAULT_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24'%3E📦%3C/text%3E%3C/svg%3E";

function formatPrice(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toFixed(2)}`;
}

/** Normalize order_summary API response to rows + totals */
function mapOrderSummary(res) {
  if (!res?.success || !res?.data) return { rows: [], subtotal: 0, tax: 0, discount: 0, grandTotal: 0 };
  const d = res.data;
  const rawItems = d.items ?? d.lines ?? d.cart ?? d.order_items ?? d.line_items ?? d.data?.items ?? d.data?.lines ?? (Array.isArray(d) ? d : []);
  const rows = (Array.isArray(rawItems) ? rawItems : []).map((r, index) => {
    const rawItemId =
      r.item_id ?? r.product_id ?? r.PRODUCT_ID ?? r.ITEM_CODE ?? r.CODE ?? r.sku ?? r.SKU
      ?? r.PROD_ID ?? r.product_code ?? r.PART_NO ?? r.PK_INV_ID ?? r.id
      ?? r.product?.id ?? r.product?.product_id ?? r.product?.code ?? r.product?.PRODUCT_ID
      ?? r.INV_ITEM_ID ?? r.ITEM_ID ?? r.PK_ID ?? "";
    const itemIdForApi = String(rawItemId).trim();
    const tlId = r.tl_id ?? r.TL_ID ?? r.line_id ?? r.LINE_ID ?? null;
    const name = r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—";
    const sku = r.sku ?? r.SKU ?? r.PRODUCT_ID ?? r.CODE ?? r.ITEM_CODE ?? (itemIdForApi || "—");
    const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
    const unitPrice = Number(r.unit_price ?? r.UNIT_PRICE ?? r.price ?? r.ITEM_RATE ?? 0) || 0;
    const lineTotal = Number(r.line_total ?? r.total ?? r.LC_AMT ?? unitPrice * qty) || 0;
    const img = r.image ?? r.IMAGE_URL ?? r.image_url ?? "";
    const id = tlId ?? (itemIdForApi || `line-${index}`);
    const apiId = itemIdForApi || (tlId != null && tlId !== "" ? String(tlId) : null);
    return {
      id,
      itemIdForApi: apiId,
      tlId: tlId != null && tlId !== "" ? tlId : null,
      name,
      sku,
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
  const prodMap = new Map(products.map((p) => [String(p.PRODUCT_ID ?? p.SKU ?? p.id), p]));
  let subtotal = 0;
  const rows = cart.items.map((it) => {
    const lt = (Number(it.unit_price) || 0) * (Number(it.qty) || 0);
    subtotal += lt;
    const p = prodMap.get(String(it.item_id ?? it.product_id));
    return {
      id: it.item_id ?? it.product_id,
      itemIdForApi: it.item_id ?? it.product_id,
      tlId: null,
      name: it.product_name ?? p?.PRODUCT_NAME ?? p?.name ?? "—",
      sku: it.sku ?? it.item_id ?? "—",
      quantity: Number(it.qty) || 0,
      price: Number(it.unit_price) || 0,
      lineTotal: lt,
      image: p?.IMAGE_URL ?? p?.IMAGE ?? p?.image ?? DEFAULT_IMG,
    };
  });
  return { rows, subtotal, tax: 0, discount: 0, grandTotal: subtotal };
}

export default function Cart() {
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
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const loadSummary = useCallback(async () => {
    const id = getCartTrnsId();
    setLoading(true);
    setError(null);
    try {
      if (id && String(id).startsWith("offline_")) {
        const cached = await getCachedOrderDetail(id);
        if (cached) {
          setTrnsId(id);
          setIsOfflineCart(true);
          setIsCachedOrderReadOnly(false);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary({ success: true, data: cached });
          setCartItems(rows);
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
      }

      if (id && isOnline) {
        const res = await getOrderSummary(id);
        if (res?.success && res?.data) {
          setTrnsId(id);
          setIsOfflineCart(false);
          setIsCachedOrderReadOnly(false);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary(res);
          setCartItems(rows);
          setSubtotal(st);
          setTax(t);
          setDiscount(d);
          setGrandTotal(gt);
          return;
        }
      }

      const syncCart = getOfflineCartSync();
      if (syncCart?.items?.length) {
        setTrnsId(null);
        setIsOfflineCart(true);
        setIsCachedOrderReadOnly(false);
        const products = await getAll("products");
        const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOfflineCartToRows(syncCart, products);
        setCartItems(rows);
        setSubtotal(st);
        setTax(t);
        setDiscount(d);
        setGrandTotal(gt);
        return;
      }
      let cart = await getOfflineCart();
      if (!cart?.items?.length) {
        await new Promise((r) => setTimeout(r, 300));
        cart = await getOfflineCart();
      }
      if (cart?.items?.length) {
        setTrnsId(null);
        setIsOfflineCart(true);
        setIsCachedOrderReadOnly(false);
        const products = await getAll("products");
        const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOfflineCartToRows(cart, products);
        setCartItems(rows);
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
          setIsCachedOrderReadOnly(true);
          const { rows, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapOrderSummary({ success: true, data: cached });
          setCartItems(rows);
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
      const newQty = Math.max(0, item.quantity + increment);
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
          await updateOfflineOrderInStores(trnsId, { items: rowsToOrderItems(newRows), grandTotal: newSubtotal });
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
    const candidate = (item.itemIdForApi ?? item.sku ?? item.id)?.toString?.() ?? "";
    const validId = candidate && candidate !== "—" ? candidate : String(item.id ?? "");
    if (!validId) return;
    const newQty = Math.max(0, item.quantity + increment);
    setActionLoading(id);
    setError(null);
    try {
      if (newQty === 0) {
        await removeCartItem(trnsId, validId, item.tlId != null ? { tl_id: item.tlId } : {});
      } else {
        await updateCartItem(trnsId, validId, newQty, item.tlId != null ? { tl_id: item.tlId } : {});
      }
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cart.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuantityChange = (id, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = num === 0 ? 0 : num;
    if (newQty === item.quantity) return;
    updateQuantity(id, newQty - item.quantity);
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
          await updateOfflineOrderInStores(trnsId, { items: rowsToOrderItems(newRows), grandTotal: newSubtotal });
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
      width: "280px",
      minWidth: "280px",
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={row.image}
              alt={row.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = DEFAULT_IMG;
              }}
            />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">SKU: {row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      width: "100px",
      minWidth: "100px",
      render: (row) => <div className="font-medium text-gray-900">{formatPrice(row.price)}</div>,
    },
    {
      header: "Quantity",
      accessor: "quantity",
      width: "180px",
      minWidth: "180px",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(row.id, -1)}
            disabled={actionLoading === row.id || isCachedOrderReadOnly}
            className="cursor-pointer w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min="0"
            value={row.quantity}
            onChange={(e) => handleQuantityChange(row.id, e.target.value)}
            disabled={isCachedOrderReadOnly}
            className="w-20 h-8 text-center border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={() => updateQuantity(row.id, 1)}
            disabled={actionLoading === row.id || isCachedOrderReadOnly}
            className="cursor-pointer w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total",
      width: "100px",
      minWidth: "100px",
      render: (row) => (
        <div className="font-semibold text-gray-900">{formatPrice(row.lineTotal)}</div>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      width: "80px",
      minWidth: "80px",
      render: (row) => (
        <button
          onClick={() => removeItem(row.id)}
          disabled={actionLoading === row.id || isCachedOrderReadOnly}
          className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ),
    },
  ];

  const emptyCart = (isOnline ? !trnsId : false) || cartItems.length === 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Header />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Link
          href="/products"
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

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
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
              <ReusableTable columns={columns} data={cartItems} showPagination={false} />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <Link href="/review" className="block">
                  <button className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    Continue to Review
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

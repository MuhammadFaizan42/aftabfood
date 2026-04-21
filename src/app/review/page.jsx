"use client";
import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getOrderReview, submitOrder, getPartySaleInvDashboard, addToCart } from "@/services/shetApi";
import { getCartTrnsId, setCartTrnsId, clearCartTrnsId, getSaleOrderPartyCode } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { getOfflineCart, clearOfflineCart } from "@/lib/offline/offlineCart";
import { getCachedCustomerDashboard, getCachedOrderDetail, cacheOrderDetail, saveOfflineOrderToExistingOrders, getExistingOrderRow, getAllProductsSnapshot, updateOfflineOrderInStores, generateOfflineOrderId, deleteOfflineOrder } from "@/lib/offline/bootstrapLoader";
import {
  DEFAULT_IMG,
  enrichOrderLinesWithImages,
  pickImageFromOrderLine,
  resolveProductImageUrl,
} from "@/lib/productImage";

/** When API omits rate but sends line total + qty, derive rate so add_to_cart/submit are consistent. */
function deriveUnitPriceFromLine(r) {
  const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
  const total = Number(r.line_total ?? r.total ?? r.LC_AMT ?? 0) || 0;
  let up = Number(r.unit_price ?? r.UNIT_PRICE ?? r.price ?? r.ITEM_RATE ?? 0) || 0;
  if (up <= 0 && qty > 0 && total > 0) up = total / qty;
  return up;
}

function formatSubmitOrderError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  // Show raw backend error (trimmed) so user can share with DBA/ERP team.
  return String(msg || "Failed to submit order.").slice(0, 900);
}

async function finalizeReviewOrderItems(items, hydrateFromApi = true) {
  if (!items?.length) return items;
  const products = await getAllProductsSnapshot();
  try {
    return await enrichOrderLinesWithImages(items, products, { hydrateFromApi });
  } catch {
    return items;
  }
}

function formatPrice(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toFixed(2)}`;
}

function normalizeDateInputForForm(val) {
  if (val == null || val === "") return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

/** Order-level fields for Finalise Order (order_review / cached snapshot). */
function pickOrderMetaFromReviewData(d) {
  if (!d || typeof d !== "object") {
    return { remarks: "", deliveryDate: "", payTerms: "", discountVal: "" };
  }
  const order = d.order && typeof d.order === "object" ? d.order : {};
  const header = d.header && typeof d.header === "object" ? d.header : {};
  const src = { ...order, ...header, ...d };
  const rawRemarks =
    src.rms ??
    src.RMS ??
    src.remarks ??
    src.REMARKS ??
    src.order_remarks ??
    src.notes ??
    src.user_note ??
    "";
  let remarks = String(rawRemarks ?? "").trim().slice(0, 150);
  // Backend sometimes returns a default "DRAFT" note for draft orders; UI should start empty.
  if (remarks.toUpperCase() === "DRAFT") remarks = "";
  const rawDel =
    src.delivery_date ??
    src.DELIVERY_DATE ??
    src.expected_delivery ??
    src.delivery_dt ??
    "";
  const deliveryDate = normalizeDateInputForForm(rawDel);
  const rawPt =
    src.pay_terms ??
    src.PAY_TERMS ??
    src.payment_terms ??
    src.PAYMENT_TERMS ??
    "";
  const payTerms = rawPt != null && String(rawPt).trim() !== "" ? String(rawPt).trim() : "";
  const rawDisc =
    src.discount_val ??
    src.discount ??
    src.discount_amount ??
    src.DISCOUNT;
  let discountVal = "";
  if (rawDisc != null && rawDisc !== "") {
    const n = Number(rawDisc);
    if (!Number.isNaN(n)) discountVal = String(n);
  }
  return { remarks, deliveryDate, payTerms, discountVal };
}

function mapReviewData(res) {
  if (!res?.success || !res?.data) {
    return {
      customer: null,
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
      remarks: "",
      deliveryDate: "",
      payTerms: "",
      discountVal: "",
    };
  }
  const d = res.data;
  const rawCustomer = d.customer ?? d.customer_info ?? d.party ?? {};
  const customer = {
    ...rawCustomer,
    CUSTOMER_NAME: rawCustomer.CUSTOMER_NAME ?? rawCustomer.customer_name ?? rawCustomer.name ?? d.party_name ?? d.customer_name ?? d.PARTY_NAME ?? d.CUSTOMER_NAME,
    SHORT_CODE: rawCustomer.SHORT_CODE ?? rawCustomer.party_code ?? rawCustomer.PARTY_CODE ?? rawCustomer.customer_id ?? rawCustomer.account_id ?? d.party_code ?? d.PARTY_CODE ?? d.customer_id ?? d.account_id,
    ADRES: rawCustomer.ADRES ?? rawCustomer.address ?? rawCustomer.ADDRESS ?? rawCustomer.delivery_address ?? d.address ?? d.ADRES ?? d.delivery_address ?? [rawCustomer.ST, rawCustomer.ADRES, rawCustomer.DIVISION, rawCustomer.PROVINCES].filter(Boolean).join(", "),
    pay_terms: rawCustomer.pay_terms ?? rawCustomer.PAY_TERMS ?? rawCustomer.payment_terms ?? d.pay_terms ?? d.PAY_TERMS ?? d.payment_terms,
  };
  const rawItems = d.items ?? d.lines ?? d.order_items ?? (Array.isArray(d) ? d : []);
  const items = (Array.isArray(rawItems) ? rawItems : []).map((r) => {
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
    const itemIdForApi = String(rawItemId).trim();
    const rawImg = pickImageFromOrderLine(r);
    const img = rawImg ? resolveProductImageUrl(rawImg) : "";
    const sku =
      r.sku ??
      r.SKU ??
      r.PRODUCT_ID ??
      r.product_id ??
      r.ITEM_CODE ??
      r.CODE ??
      r.product_code ??
      (itemIdForApi || "");
    return {
      id: r.item_id ?? r.product_id ?? r.id ?? itemIdForApi,
      itemIdForApi: itemIdForApi || null,
      name: r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—",
      sku: String(sku || itemIdForApi || "—").trim() || "—",
      unitPrice: deriveUnitPriceFromLine(r),
      quantity: Number(r.qty ?? r.quantity ?? 0) || 0,
      total: Number(r.line_total ?? r.total ?? 0) || 0,
      image: img || DEFAULT_IMG,
      uom: String(r.uom ?? r.UOM ?? "").trim(),
      batch_no: String(r.batch_no ?? r.BATCH_NO ?? r.batch ?? "").trim(),
      exp_date: String(r.exp_date ?? r.EXP_DATE ?? r.expiry_date ?? "").trim(),
      comments: String(r.comments ?? r.COMMENTS ?? "").trim(),
    };
  });
  const subtotal = Number(d.subtotal ?? d.sub_total ?? 0) || items.reduce((s, r) => s + r.total, 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal = Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  const meta = pickOrderMetaFromReviewData(d);
  return { customer, items, subtotal, tax, discount, grandTotal, ...meta };
}

function OrderReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const isViewOnly = (searchParams?.get("mode") || "").toLowerCase() === "view";
  const [trnsId, setTrnsId] = useState(null);
  const [isOfflineOrder, setIsOfflineOrder] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [payTerms, setPayTerms] = useState("");
  const [discountVal, setDiscountVal] = useState("");
  const [remarks, setRemarks] = useState("");
  const [customerEnrich, setCustomerEnrich] = useState(null);
  const [isCachedServerOrder, setIsCachedServerOrder] = useState(false);
  const [hasBackendTrnsId, setHasBackendTrnsId] = useState(false);
  const [backendTrnsId, setBackendTrnsId] = useState(null);
  const submitInFlightRef = useRef(false);

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCustomerEnrich(null);
    const id = getCartTrnsId();
    let hasOfflineCartItems = false;
    try {
      const oc = await getOfflineCart();
      hasOfflineCartItems = Array.isArray(oc?.items) && oc.items.length > 0;
    } catch {
      hasOfflineCartItems = false;
    }
    const isOfflineTrnsId = Boolean(id && String(id).startsWith("offline_"));

    if (isViewOnly && id) {
      if (isOnline) {
        setTrnsId(id);
        setIsOfflineOrder(false);
        try {
          const res = await getOrderReview(id);
          try {
            await cacheOrderDetail(id, res?.data ?? res);
          } catch { /* ignore */ }
          const rev = mapReviewData(res);
          const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
          setCustomer(c);
          setOrderItems(await finalizeReviewOrderItems(items, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(disc);
          setGrandTotal(gt);
          setRemarks(rev.remarks ?? "");
          setDeliveryDate(rev.deliveryDate ?? "");
          setPayTerms(rev.payTerms ?? "");
          setDiscountVal(rev.discountVal ?? "");
          const partyCode = getSaleOrderPartyCode();
          if (partyCode) {
            try {
              const dash = await getPartySaleInvDashboard(partyCode);
              const cust = dash?.data?.customer;
              if (cust) {
                const deliveryArea = [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—";
                const paymentTerms = cust.PAY_TERMS ?? cust.pay_terms ?? cust.PAYMENT_TERMS ?? "—";
                setCustomerEnrich({ deliveryArea, paymentTerms });
              }
            } catch { /* ignore */ }
          }
        } catch (err) {
          try {
            const cached = await getCachedOrderDetail(id);
            if (cached) {
              const isOfflineId = id && String(id).startsWith("offline_");
              setTrnsId(id);
              setIsOfflineOrder(!!isOfflineId);
              setIsCachedServerOrder(!isOfflineId);
              const rev = mapReviewData({ success: true, data: cached });
              const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
              setCustomer(c);
              setOrderItems(await finalizeReviewOrderItems(items, isOnline));
              setSubtotal(st);
              setTax(t);
              setDiscount(disc);
              setGrandTotal(gt);
              setRemarks(rev.remarks ?? "");
              setDeliveryDate(rev.deliveryDate ?? "");
              setPayTerms(rev.payTerms ?? "");
              setDiscountVal(rev.discountVal ?? "");
            } else {
              setError(err instanceof Error ? err.message : "Failed to load order review.");
            }
          } catch {
            setError(err instanceof Error ? err.message : "Failed to load order review.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        setTrnsId(id);
        const isOfflineId = id && String(id).startsWith("offline_");
        setIsOfflineOrder(!!isOfflineId);
        setIsCachedServerOrder(!isOfflineId);
        try {
          const cached = await getCachedOrderDetail(id);
          if (cached) {
            const rev = mapReviewData({ success: true, data: cached });
            const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
            setCustomer(c);
            setOrderItems(await finalizeReviewOrderItems(items, isOnline));
            setSubtotal(st);
            setTax(t);
            setDiscount(disc);
            setGrandTotal(gt);
            setRemarks(rev.remarks ?? "");
            setDeliveryDate(rev.deliveryDate ?? "");
            setPayTerms(rev.payTerms ?? "");
            setDiscountVal(rev.discountVal ?? "");
            if (isOfflineId) {
              const row = await getExistingOrderRow(id);
              const bid = row?.backend_trns_id;
              setHasBackendTrnsId(!!bid);
              setBackendTrnsId(bid ?? null);
            }
          } else {
            setError("Order details not in cache. View this order when online first.");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load order.");
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (isOnline && id) {
      setIsCachedServerOrder(false);
      setTrnsId(id);
      setIsOfflineOrder(false);
      try {
        const res = await getOrderReview(id);
        try {
          await cacheOrderDetail(id, res?.data ?? res);
        } catch { /* ignore */ }
        const rev = mapReviewData(res);
        const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
        setCustomer(c);
        setOrderItems(await finalizeReviewOrderItems(items, isOnline));
        setSubtotal(st);
        setTax(t);
        setDiscount(disc);
        setGrandTotal(gt);
        setRemarks(rev.remarks ?? "");
        setDeliveryDate(rev.deliveryDate ?? "");
        setPayTerms(rev.payTerms ?? "");
        setDiscountVal(rev.discountVal ?? "");
        const partyCode = getSaleOrderPartyCode();
        if (partyCode) {
          try {
            const dash = await getPartySaleInvDashboard(partyCode);
            const cust = dash?.data?.customer;
            if (cust) {
              const deliveryArea = [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—";
              const paymentTerms = cust.PAY_TERMS ?? cust.pay_terms ?? cust.PAYMENT_TERMS ?? "—";
              setCustomerEnrich({ deliveryArea, paymentTerms });
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        const cached = await getCachedOrderDetail(id).catch(() => null);
        if (cached) {
          const isOfflineId = String(id).startsWith("offline_");
          setTrnsId(id);
          setIsOfflineOrder(isOfflineId);
          setIsCachedServerOrder(!isOfflineId);
          const rev = mapReviewData({ success: true, data: cached });
          const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
          setCustomer(c);
          setOrderItems(await finalizeReviewOrderItems(items, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(disc);
          setGrandTotal(gt);
          setRemarks(rev.remarks ?? "");
          setDeliveryDate(rev.deliveryDate ?? "");
          setPayTerms(rev.payTerms ?? "");
          setDiscountVal(rev.discountVal ?? "");
          if (isOfflineId) {
            const row = await getExistingOrderRow(id);
            setHasBackendTrnsId(!!row?.backend_trns_id);
            setBackendTrnsId(row?.backend_trns_id ?? null);
          }
        } else {
          setError(err instanceof Error ? err.message : "Failed to load order review.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Stale server trns_id in storage must not hide an offline cart: only use cached-by-id when
      // there is no pending offline cart, or we are resuming an offline_* draft.
      if (!isOnline && id && (!hasOfflineCartItems || isOfflineTrnsId)) {
        const cached = await getCachedOrderDetail(id);
        if (cached) {
          setTrnsId(id);
          const isOfflineId = String(id).startsWith("offline_");
          setIsOfflineOrder(isOfflineId);
          setIsCachedServerOrder(!isOfflineId);
          const rev = mapReviewData({ success: true, data: cached });
          const { customer: c, items, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
          setCustomer(c);
          setOrderItems(await finalizeReviewOrderItems(items, isOnline));
          setSubtotal(st);
          setTax(t);
          setDiscount(disc);
          setGrandTotal(gt);
          setRemarks(rev.remarks ?? "");
          setDeliveryDate(rev.deliveryDate ?? "");
          setPayTerms(rev.payTerms ?? "");
          setDiscountVal(rev.discountVal ?? "");
          if (isOfflineId) {
            const row = await getExistingOrderRow(id);
            const bid = row?.backend_trns_id;
            setHasBackendTrnsId(!!bid);
            setBackendTrnsId(bid ?? null);
          }
          setLoading(false);
          return;
        }
      }
      setIsCachedServerOrder(false);
      setTrnsId(null);
      setIsOfflineOrder(true);
      try {
        const cart = await getOfflineCart();
        if (!cart?.items?.length) {
          setLoading(false);
          return;
        }
        const existingId = getCartTrnsId();
        if (existingId && String(existingId).startsWith("offline_")) {
          let alreadyCached = await getCachedOrderDetail(existingId);
          if (!alreadyCached) {
            await new Promise((r) => setTimeout(r, 400));
            alreadyCached = await getCachedOrderDetail(existingId);
          }
          if (alreadyCached) {
            setTrnsId(existingId);
            setIsOfflineOrder(true);
            const rev = mapReviewData({ success: true, data: alreadyCached });
            const { customer: c, items: cachedItems, subtotal: st, tax: t, discount: disc, grandTotal: gt } = rev;
            setCustomer(c);
            setOrderItems(await finalizeReviewOrderItems(cachedItems, isOnline));
            setSubtotal(st);
            setTax(t);
            setDiscount(disc);
            setGrandTotal(gt);
            setRemarks(rev.remarks ?? "");
            setDeliveryDate(rev.deliveryDate ?? "");
            setPayTerms(rev.payTerms ?? "");
            setDiscountVal(rev.discountVal ?? "");
            const row = await getExistingOrderRow(existingId);
            setHasBackendTrnsId(!!row?.backend_trns_id);
            setBackendTrnsId(row?.backend_trns_id ?? null);
            setLoading(false);
            return;
          }
          const orderId = existingId;
          setCartTrnsId(orderId);
          const dash = cart.customer_id ? await getCachedCustomerDashboard(cart.customer_id) : null;
          const cust = dash?.customer ?? {};
          const customer = {
            CUSTOMER_NAME: cust.CUSTOMER_NAME ?? cust.customer_name ?? "Offline order",
            SHORT_CODE: cart.customer_id ?? "",
            ADRES: [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—",
            pay_terms: cust.PAY_TERMS ?? cust.pay_terms ?? "—",
          };
          setCustomer(customer);
          const items = cart.items.map((it) => {
            const total = (Number(it.unit_price) || 0) * (Number(it.qty) || 0);
            const saved = it.image_url ?? it.IMAGE_URL;
            const img =
              saved && String(saved).trim()
                ? resolveProductImageUrl(String(saved).trim())
                : DEFAULT_IMG;
            return {
              id: it.item_id ?? it.product_id,
              itemIdForApi: it.item_id ?? it.product_id,
              name: it.product_name ?? "—",
              sku: it.sku ?? String(it.item_id ?? "") ?? "",
              unitPrice: Number(it.unit_price) || 0,
              quantity: Number(it.qty) || 0,
              total,
              image: img,
              uom: String(it.uom ?? it.UOM ?? "").trim(),
              batch_no: String(it.batch_no ?? it.BATCH_NO ?? "").trim(),
              exp_date: String(it.exp_date ?? it.EXP_DATE ?? it.expiry_date ?? "").trim(),
              comments: String(it.comments ?? "").trim(),
            };
          });
          const st = items.reduce((s, r) => s + r.total, 0);
          const displayItems = await finalizeReviewOrderItems(items, isOnline);
          setOrderItems(displayItems);
          setSubtotal(st);
          setTax(0);
          setDiscount(0);
          setGrandTotal(st);
          setTrnsId(orderId);
          setHasBackendTrnsId(false);
          try {
            await saveOfflineOrderToExistingOrders({
              customer,
              items: displayItems,
              subtotal: st,
              tax: 0,
              discount: 0,
              grandTotal: st,
              customer_id: cart.customer_id,
              delivery_date: "",
              pay_terms: "",
              discount_val: "",
              remarks: "",
              orderId,
            });
          } catch {
            /* ignore IDB errors */
          }
          setLoading(false);
          return;
        }
        const orderId = generateOfflineOrderId();
        setCartTrnsId(orderId);
        const dash = cart.customer_id ? await getCachedCustomerDashboard(cart.customer_id) : null;
        const cust = dash?.customer ?? {};
        const customer = {
          CUSTOMER_NAME: cust.CUSTOMER_NAME ?? cust.customer_name ?? "Offline order",
          SHORT_CODE: cart.customer_id ?? "",
          ADRES: [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—",
          pay_terms: cust.PAY_TERMS ?? cust.pay_terms ?? "—",
        };
        setCustomer(customer);
        const items = cart.items.map((it) => {
          const total = (Number(it.unit_price) || 0) * (Number(it.qty) || 0);
          const saved = it.image_url ?? it.IMAGE_URL;
          const img =
            saved && String(saved).trim()
              ? resolveProductImageUrl(String(saved).trim())
              : DEFAULT_IMG;
          return {
            id: it.item_id ?? it.product_id,
            itemIdForApi: it.item_id ?? it.product_id,
            name: it.product_name ?? "—",
            sku: it.sku ?? String(it.item_id ?? "") ?? "",
            unitPrice: Number(it.unit_price) || 0,
            quantity: Number(it.qty) || 0,
            total,
            image: img,
            uom: String(it.uom ?? it.UOM ?? "").trim(),
            batch_no: String(it.batch_no ?? it.BATCH_NO ?? "").trim(),
            exp_date: String(it.exp_date ?? it.EXP_DATE ?? it.expiry_date ?? "").trim(),
            comments: String(it.comments ?? "").trim(),
          };
        });
        const st = items.reduce((s, r) => s + r.total, 0);
        const displayItems = await finalizeReviewOrderItems(items, isOnline);
        setOrderItems(displayItems);
        setSubtotal(st);
        setTax(0);
        setDiscount(0);
        setGrandTotal(st);
        try {
          await saveOfflineOrderToExistingOrders({
            customer,
            items: displayItems,
            subtotal: st,
            tax: 0,
            discount: 0,
            grandTotal: st,
            customer_id: cart.customer_id,
            delivery_date: "",
            pay_terms: "",
            discount_val: "",
            remarks: "",
            orderId,
          });
          setHasBackendTrnsId(false);
        } catch {
          // ignore cache errors
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review.");
      } finally {
        setLoading(false);
      }
    }
  }, [isOnline, isViewOnly]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  useEffect(() => {
    if (!trnsId || !isOfflineOrder || !String(trnsId).startsWith("offline_")) return;
    updateOfflineOrderInStores(trnsId, {
      delivery_date: deliveryDate,
      pay_terms: payTerms,
      discount_val: discountVal,
      remarks: remarks,
    }).catch(() => { });
  }, [trnsId, isOfflineOrder, deliveryDate, payTerms, discountVal, remarks]);

  const handleSubmitOrder = async () => {
    if (isViewOnly) return;
    if (submitInFlightRef.current || submitting) return;
    if (isCachedServerOrder && !isOnline) {
      setError("Connect online to submit this order.");
      return;
    }
    if (isOfflineOrder && !hasBackendTrnsId && !isOnline) {
      setError("Sync when online to submit this order. Order is saved locally.");
      return;
    }

    const options = {};
    if (deliveryDate) options.delivery_date = deliveryDate;
    if (payTerms) options.pay_terms = payTerms;
    if (discountVal !== "" && !Number.isNaN(Number(discountVal))) options.discount = Number(discountVal);
    if (remarks) options.remarks = remarks;

    submitInFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      if (isOfflineOrder && hasBackendTrnsId && backendTrnsId) {
        clearCartTrnsId();
        router.push(`/order-success?order_id=${encodeURIComponent(backendTrnsId)}`);
        return;
      }

      if (isOfflineOrder && !hasBackendTrnsId && isOnline) {
        const customerId = String(
          getSaleOrderPartyCode() ||
            customer?.SHORT_CODE ||
            customer?.PARTY_CODE ||
            customer?.party_code ||
            customer?.customer_id ||
            "",
        ).trim();
        if (!customerId) {
          throw new Error(
            "Customer (party) is missing. Open the cart from the customer or products page with a party selected.",
          );
        }
        let serverTrns = null;
        for (const row of orderItems) {
          const itemId = row.itemIdForApi ?? row.id;
          if (!itemId) continue;
          let unitPrice = Number(row.unitPrice ?? 0) || 0;
          const qty = Number(row.quantity ?? 0) || 0;
          const lineTotal = Number(row.total ?? 0) || 0;
          if (unitPrice <= 0 && qty > 0 && lineTotal > 0) unitPrice = lineTotal / qty;
          const res = await addToCart(
            customerId,
            String(itemId),
            qty,
            serverTrns,
            {
              unit_price: unitPrice,
              uom: row.uom ?? "",
              comments: row.comments ?? "",
              batch_no: row.batch_no ?? "",
              exp_date: row.exp_date ?? row.expiry_date ?? "",
            },
          );
          if (res && typeof res === "object" && res.success === false) {
            throw new Error(res.message || "Add to cart failed.");
          }
          const next = res?.data?.trns_id ?? res?.trns_id;
          if (next != null && next !== "") serverTrns = next;
        }
        if (serverTrns == null || serverTrns === "") {
          throw new Error("Could not create a server draft for this order. Check line items and try again.");
        }
        const submitRes = await submitOrder(serverTrns, options);
        if (submitRes && typeof submitRes === "object" && submitRes.success === false) {
          throw new Error(submitRes.message || "Submit order failed.");
        }
        if (trnsId && String(trnsId).startsWith("offline_")) {
          try {
            await deleteOfflineOrder(trnsId);
          } catch {
            /* ignore */
          }
        }
        try {
          await clearOfflineCart();
        } catch {
          /* ignore */
        }
        clearCartTrnsId();
        const orderId =
          submitRes?.data?.order_number ??
          submitRes?.data?.order_id ??
          submitRes?.data?.trns_id ??
          serverTrns;
        router.push(`/order-success?order_id=${encodeURIComponent(orderId)}`);
        return;
      }

      if (!trnsId) return;
      const res = await submitOrder(trnsId, options);
      clearCartTrnsId();
      const orderId = res?.data?.order_number ?? res?.data?.order_id ?? res?.data?.trns_id ?? trnsId;
      router.push(`/order-success?order_id=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setError(formatSubmitOrderError(err));
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const storedPartyCode = typeof window !== "undefined" ? getSaleOrderPartyCode() : null;
  const baseInfo = customer
    ? {
      name: customer.CUSTOMER_NAME ?? customer.name ?? customer.customer_name ?? "—",
      accountId: customer.SHORT_CODE ?? customer.PARTY_CODE ?? customer.party_code ?? customer.customer_id ?? customer.account_id ?? storedPartyCode ?? "—",
      deliveryArea: customer.ADRES ?? customer.ADDRESS ?? customer.address ?? customer.delivery_address ?? ((typeof customer.ADRES === "string" ? customer.ADRES : [customer.ST, customer.ADRES, customer.DIVISION, customer.PROVINCES].filter(Boolean).join(", ")) || "—"),
      paymentTerms: customer.pay_terms ?? customer.PAY_TERMS ?? customer.payment_terms ?? "—",
    }
    : {
      name: "—",
      accountId: storedPartyCode ?? "—",
      deliveryArea: "—",
      paymentTerms: "—",
    };
  const customerInfo = customerEnrich
    ? {
      ...baseInfo,
      deliveryArea: baseInfo.deliveryArea && baseInfo.deliveryArea !== "—" ? baseInfo.deliveryArea : customerEnrich.deliveryArea,
      paymentTerms: baseInfo.paymentTerms && baseInfo.paymentTerms !== "—" ? baseInfo.paymentTerms : customerEnrich.paymentTerms,
    }
    : baseInfo;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-12 text-gray-500">Loading order review...</div>
        </main>
      </div>
    );
  }

  if (!trnsId && !isOfflineOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-4">
            No order in progress. Add items from the product listing and go to Cart → Review.
          </div>
          <Link href="/products" className="text-blue-600 hover:text-blue-800">
            Go to Products
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isViewOnly ? "Order Detail" : "Order Review"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isViewOnly ? "Viewing an existing order" : "Verify details and submit"}
            </p>
          </div>
          {!isViewOnly && (
            <Link href="/cart">
              <button className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600">
                Edit Cart
              </button>
            </Link>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Name</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account ID</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.accountId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery / Address</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.deliveryArea}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Terms</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.paymentTerms}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                {!isViewOnly && (
                  <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit Items
                  </Link>
                )}
              </div>
              <ReusableTable
                columns={[
                  {
                    header: "Product",
                    accessor: "name",
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={row.image || DEFAULT_IMG}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_IMG;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">UOM: {row.uom || "—"}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: "Unit Price",
                    accessor: "unitPrice",
                    render: (row) => <span className="text-gray-700">{formatPrice(row.unitPrice)}</span>,
                  },
                  {
                    header: "Qty",
                    accessor: "quantity",
                    render: (row) => <span className="text-gray-700">{row.quantity}</span>,
                  },
                  {
                    header: "Total",
                    accessor: "total",
                    render: (row) => <span className="font-semibold text-gray-900">{formatPrice(row.total)}</span>,
                  },
                ]}
                data={orderItems}
                showPagination={false}
                rowsPerPage={100}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Finalise Order</h2>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery Date (optional)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Terms (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Net 30"
                  value={payTerms}
                  onChange={(e) => setPayTerms(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Discount (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Remarks (optional)</label>
                <textarea
                  rows={2}
                  maxLength={150}
                  placeholder="Notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none disabled:bg-gray-100"
                />
              </div>

              {(() => {
                const discountAmount = discountVal !== "" && !Number.isNaN(Number(discountVal)) ? Math.max(0, Number(discountVal)) : discount;
                const displayGrandTotal = subtotal + tax - discountAmount;
                return (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    {/* <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">-{formatPrice(discountAmount)}</span>
                    </div> */}
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatPrice(displayGrandTotal)}</span>
                    </div>
                  </div>
                );
              })()}

              {!isViewOnly && (
                <>
                  {isCachedServerOrder && !isOnline && (
                    <p className="text-sm text-amber-600 mb-2">
                      Connect online to submit this order.
                    </p>
                  )}
                  {isOfflineOrder && !hasBackendTrnsId && !isOnline && (
                    <p className="text-sm text-amber-600 mb-2">
                      Sync when online to submit this order. Order is saved locally.
                    </p>
                  )}
                  {isOfflineOrder && !hasBackendTrnsId && isOnline && (
                    <p className="text-sm text-blue-700 mb-2">
                      This order was saved on your device. Submit will send it to the server now.
                    </p>
                  )}
                  {isOfflineOrder && hasBackendTrnsId && (
                    <p className="text-sm text-green-600 mb-2">
                      Order synced. You can view it below.
                    </p>
                  )}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={
                      submitting ||
                      (isCachedServerOrder && !isOnline) ||
                      (isOfflineOrder && !hasBackendTrnsId && !isOnline)
                    }
                    className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {submitting
                      ? "Submitting..."
                      : isOfflineOrder && hasBackendTrnsId
                        ? "View Order"
                        : "Submit Order"}
                  </button>
                  <p className="text-xs text-center text-gray-500">
                    By submitting, you agree to the sales terms.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="text-center py-12 text-gray-500">Loading order review...</div>
          </main>
        </div>
      }
    >
      <OrderReviewContent />
    </Suspense>
  );
}

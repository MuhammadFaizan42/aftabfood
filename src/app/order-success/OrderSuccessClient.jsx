"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import { getOrderReview, getExistingOrders } from "@/services/shetApi";
import { getCachedOrderDetail } from "@/lib/offline/bootstrapLoader";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { buildOrderDetailPdfBlob } from "@/lib/orderDetailPdf";
import { shareOrDownloadPdf } from "@/lib/productCatalogPdf";
import { normalizeOrderCustomer, displayCustomerField } from "@/lib/orderCustomerNormalize";
import { enrichOrderDetailsWithCustomerMaster } from "@/lib/orderCustomerMaster";
import { getSaleOrderPartyCode } from "@/lib/api";
import {
  formatSaleOrderDisplay,
  isNonSoOrderIdParam,
  pickSaleOrderRawLabel,
} from "@/lib/saleOrderLabel";

function buildShareText(displayId, orderDetails) {
  let text = `Sale order ${displayId}\n`;
  if (!orderDetails) {
    text += "Order placed successfully. Full details will be available after sync.";
    return text;
  }
  const { customer, items, subtotal, tax, discount, grandTotal, _orderRoot } = orderDetails;
  const c = normalizeOrderCustomer(customer || {}, _orderRoot || {});
  const custName = displayCustomerField(c.CUSTOMER_NAME);
  const custCode = displayCustomerField(c.SHORT_CODE);
  const address = displayCustomerField(c.ADRES);
  const contact = displayCustomerField(c.CONT_PERSON);
  const phone = displayCustomerField(c.CONT_NUM);

  text += "\n--- CUSTOMER ---\n";
  text += `Name: ${custName}\n`;
  text += `Code: ${custCode}\n`;
  text += `Address: ${address}\n`;
  text += `Contact: ${contact}\n`;
  text += `Phone: ${phone}\n`;
  text += "\n--- ITEMS ---\n";
  (items || []).forEach((line, i) => {
    const name = line.name ?? line.product_name ?? "—";
    const qty = line.quantity ?? line.qty ?? 0;
    const price = line.unitPrice ?? line.unit_price ?? 0;
    const total = line.total ?? line.line_total ?? qty * price;
    text += `${i + 1}. ${name} | Qty: ${qty} x £${Number(price).toFixed(2)} = £${Number(total).toFixed(2)}\n`;
  });
  text += "\n--- TOTALS ---\n";
  text += `Subtotal: £${Number(subtotal ?? 0).toFixed(2)}\n`;
  if (Number(tax) !== 0) text += `Tax: £${Number(tax).toFixed(2)}\n`;
  if (Number(discount) !== 0) text += `Discount: £${Number(discount).toFixed(2)}\n`;
  text += `Grand Total: £${Number(grandTotal ?? 0).toFixed(2)}\n`;
  return text;
}

function mapOrderDetails(res) {
  const d = res?.data ?? res;
  if (!d || typeof d !== "object") return null;
  const rawCustomer = d.customer ?? d.customer_info ?? d.party ?? {};
  let customer = normalizeOrderCustomer(rawCustomer, d);
  const partySession =
    typeof window !== "undefined" ? getSaleOrderPartyCode() : null;
  if (!String(customer.SHORT_CODE || "").trim() && partySession) {
    customer = { ...customer, SHORT_CODE: String(partySession).trim() };
  }
  const rawItems = d.items ?? d.lines ?? d.order_items ?? (Array.isArray(d) ? d : []);
  const items = (Array.isArray(rawItems) ? rawItems : []).map((r) => ({
    name: r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—",
    quantity: Number(r.qty ?? r.quantity ?? 0) || 0,
    unitPrice: Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? 0) || 0,
    total: Number(r.line_total ?? r.total ?? 0) || 0,
    sku: String(r.item_id ?? r.ITEM_ID ?? r.PRODUCT_ID ?? r.PRODUCT_CODE ?? r.sku ?? "—").trim() || "—",
    batch: String(r.batch_no ?? r.BATCH_NO ?? r.batch ?? "").trim() || "—",
    uom: String(r.uom ?? r.UOM ?? "").trim() || "—",
    image: String(r.IMAGE_URL ?? r.image_url ?? r.image ?? "").trim(),
  }));
  const subtotal = Number(d.subtotal ?? d.sub_total ?? 0) || items.reduce((s, r) => s + (r.total || 0), 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal = Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  const orderDate = d.order_date ?? d.ORDER_DATE ?? d.doc_date ?? d.DOC_DATE ?? d.created_at ?? "";
  const deliveryDate = d.delivery_date ?? d.DELIVERY_DATE ?? d.DEL_DATE ?? "";
  const payTerms = d.pay_terms ?? d.PAY_TERMS ?? d.payment_terms ?? "";
  const remarks =
    d.rms ?? d.RMS ?? d.remarks ?? d.REMARKS ?? d.comments ?? d.COMMENTS ?? "";
  return {
    customer,
    items,
    subtotal,
    tax,
    discount,
    grandTotal,
    orderDate,
    deliveryDate,
    payTerms,
    remarks,
    _orderRoot: d,
  };
}

export default function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const [copied, setCopied] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderPdfBusy, setOrderPdfBusy] = useState(false);
  const [orderPdfError, setOrderPdfError] = useState(null);

  const orderId = searchParams.get("order_id") || `ORD-${Date.now()}`;
  const isOffline = searchParams.get("offline") === "1";
  const [displayOrderNumber, setDisplayOrderNumber] = useState(null);
  const [orderNumberResolved, setOrderNumberResolved] = useState(false);

  const loadOrderNumberFromExisting = useCallback(async (baseOrderId) => {
    try {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const from_date = from.toISOString().slice(0, 10);
      const to_date = to.toISOString().slice(0, 10);
      const res = await getExistingOrders({ from_date, to_date });
      const raw =
        res?.data?.orders ??
        res?.data?.list ??
        res?.data?.items ??
        (Array.isArray(res?.data) ? res.data : []);
      const match = (raw || []).find(
        (r) => String(r.trns_id ?? r.TRNS_ID ?? "").trim() === String(baseOrderId).trim(),
      );
      if (match) {
        const label = pickSaleOrderRawLabel(match);
        if (label) setDisplayOrderNumber(label);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadOrderDetails = useCallback(async () => {
    if (!orderId || orderId.startsWith("ORD-")) {
      setOrderNumberResolved(true);
      return;
    }
    const isOfflineId = orderId.startsWith("offline_");
    setOrderNumberResolved(false);
    try {
      if (isOnline && !isOfflineId) {
        const res = await getOrderReview(orderId);
        let mapped = mapOrderDetails(res);
        if (mapped) mapped = await enrichOrderDetailsWithCustomerMaster(mapped, true);
        setOrderDetails(mapped);
        const d = res?.data ?? res;
        const label = pickSaleOrderRawLabel(d);
        if (label) {
          setDisplayOrderNumber(label);
        } else {
          setDisplayOrderNumber(null);
          await loadOrderNumberFromExisting(orderId);
        }
      } else {
        const cached = await getCachedOrderDetail(orderId);
        let mapped = mapOrderDetails({ success: true, data: cached });
        if (mapped) mapped = await enrichOrderDetailsWithCustomerMaster(mapped, isOnline);
        setOrderDetails(mapped);
        const cl = pickSaleOrderRawLabel(cached);
        if (cl) setDisplayOrderNumber(cl);
        else setDisplayOrderNumber(null);
      }
    } catch {
      try {
        const cached = await getCachedOrderDetail(orderId);
        let mapped = mapOrderDetails({ success: true, data: cached });
        if (mapped) mapped = await enrichOrderDetailsWithCustomerMaster(mapped, isOnline);
        setOrderDetails(mapped);
        const cl = pickSaleOrderRawLabel(cached);
        if (cl) setDisplayOrderNumber(cl);
        else setDisplayOrderNumber(null);
      } catch {
        setOrderDetails(null);
        setDisplayOrderNumber(null);
      }
    } finally {
      setOrderNumberResolved(true);
    }
  }, [orderId, isOnline, loadOrderNumberFromExisting]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const isNumericTrnsId = /^\d+$/.test(String(orderId).trim());
  const showOrderNumberPlaceholder = !orderNumberResolved && isNumericTrnsId;
  const displayId = useMemo(() => {
    if (isNonSoOrderIdParam(orderId)) {
      return displayOrderNumber ?? orderId;
    }
    const raw = displayOrderNumber ?? orderId;
    const trns = String(orderId).trim();
    return formatSaleOrderDisplay(raw, {
      orderDate: orderDetails?.orderDate,
      trnsFallback: /^\d+$/.test(trns) ? trns : undefined,
    });
  }, [orderId, displayOrderNumber, orderDetails?.orderDate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = buildShareText(displayId, orderDetails);

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  const handleShareEmail = () => {
    const subject = `Sale order ${displayId} — details`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
  };

  const handleShareOrderPdf = async () => {
    setOrderPdfError(null);
    if (!orderDetails) {
      setOrderPdfError("Order details are not loaded yet. Wait a moment or open this page when online.");
      return;
    }
    setOrderPdfBusy(true);
    try {
      const blob = await buildOrderDetailPdfBlob({
        saleOrderLabel: displayId,
        orderDate: orderDetails.orderDate,
        customer: orderDetails.customer,
        orderRoot: orderDetails._orderRoot,
        items: orderDetails.items,
        subtotal: orderDetails.subtotal,
        tax: orderDetails.tax,
        discount: orderDetails.discount,
        grandTotal: orderDetails.grandTotal,
        deliveryDate: orderDetails.deliveryDate,
        payTerms: orderDetails.payTerms,
        remarks: orderDetails.remarks,
      });
      const safe = String(displayId).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
      const filename = `SalesOrder_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const hint = `Sales order ${displayId} — PDF for ${orderDetails.customer?.CUSTOMER_NAME ?? "customer"}.`;
      await shareOrDownloadPdf(blob, filename, hint);
    } catch (e) {
      console.error(e);
      setOrderPdfError(e instanceof Error ? e.message : "Could not create PDF.");
    } finally {
      setOrderPdfBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-[550px] w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2 min-w-[140px] flex justify-center">
              {showOrderNumberPlaceholder ? (
                <span className="text-sm text-gray-500 font-mono flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Loading order number…
                </span>
              ) : (
                <span className="text-sm text-gray-600 font-mono">{displayId}</span>
              )}
            </div>
            <button
              onClick={handleCopy}
              disabled={showOrderNumberPlaceholder}
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={copied ? "Copied!" : "Copy order number"}
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            {isOffline
              ? "Order saved locally. It will sync to the server automatically when you are back online."
              : "The transaction has been verified and synced with the ERP system. A confirmation email has been sent."}
          </p>

          <p className="text-gray-500 text-xs mb-2">Share with customer or admin</p>
          <p className="text-gray-400 text-[11px] mb-4">
            PDF includes sale order no., customer name, address, phone, line items with images, and totals. Use Share PDF for WhatsApp (with file on phone) or download and attach to email.
          </p>
          {orderPdfError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4 text-left">
              {orderPdfError}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={handleShareOrderPdf}
              disabled={orderPdfBusy || showOrderNumberPlaceholder}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              title="Share or download PDF (images + full details)"
            >
              {orderPdfBusy ? (
                <span className="text-sm">Building PDF…</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Share PDF
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium transition-colors"
              title="Share text summary via WhatsApp"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.172-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp (text)
            </button>
            <button
              type="button"
              onClick={handleShareEmail}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
              title="Email text summary (attach PDF separately after Share PDF)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email (text)
            </button>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

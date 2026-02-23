"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import { getOrderReview, getExistingOrders } from "@/services/shetApi";
import { getCachedOrderDetail } from "@/lib/offline/bootstrapLoader";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

function buildShareText(displayId, orderDetails) {
  let text = `Order ${displayId}\n`;
  if (!orderDetails) {
    text += "Order placed successfully. Full details will be available after sync.";
    return text;
  }
  const { customer, items, subtotal, tax, discount, grandTotal } = orderDetails;
  const custName = customer?.CUSTOMER_NAME ?? customer?.customer_name ?? customer?.name ?? "—";
  const custCode = customer?.SHORT_CODE ?? customer?.party_code ?? customer?.PARTY_CODE ?? "—";
  const address = customer?.ADRES ?? customer?.address ?? customer?.ADDRESS ?? "—";
  const contact = customer?.CONT_PERSON ?? customer?.contactPerson ?? "—";
  const phone = customer?.CONT_NUM ?? customer?.contactNum ?? customer?.mobile ?? "—";

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
  const customer = {
    ...rawCustomer,
    CUSTOMER_NAME: rawCustomer.CUSTOMER_NAME ?? rawCustomer.customer_name ?? rawCustomer.name ?? d.party_name ?? d.customer_name,
    SHORT_CODE: rawCustomer.SHORT_CODE ?? rawCustomer.party_code ?? rawCustomer.PARTY_CODE ?? rawCustomer.customer_id,
    ADRES: rawCustomer.ADRES ?? rawCustomer.address ?? rawCustomer.ADDRESS ?? [rawCustomer.ST, rawCustomer.ADRES, rawCustomer.DIVISION, rawCustomer.PROVINCES].filter(Boolean).join(", "),
    CONT_PERSON: rawCustomer.CONT_PERSON ?? rawCustomer.contactPerson,
    CONT_NUM: rawCustomer.CONT_NUM ?? rawCustomer.contactNum ?? rawCustomer.mobile,
  };
  const rawItems = d.items ?? d.lines ?? d.order_items ?? (Array.isArray(d) ? d : []);
  const items = (Array.isArray(rawItems) ? rawItems : []).map((r) => ({
    name: r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—",
    quantity: Number(r.qty ?? r.quantity ?? 0) || 0,
    unitPrice: Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? 0) || 0,
    total: Number(r.line_total ?? r.total ?? 0) || 0,
  }));
  const subtotal = Number(d.subtotal ?? d.sub_total ?? 0) || items.reduce((s, r) => s + (r.total || 0), 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal = Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  return { customer, items, subtotal, tax, discount, grandTotal };
}

export default function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const [copied, setCopied] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const orderId = searchParams.get("order_id") || `ORD-${Date.now()}`;
  const isOffline = searchParams.get("offline") === "1";
  const [displayOrderNumber, setDisplayOrderNumber] = useState(null);
  const [orderNumberResolved, setOrderNumberResolved] = useState(false);

  const loadOrderNumberFromExisting = useCallback(
    async (baseOrderId) => {
      try {
        const today = new Date();
        const day = today.toISOString().slice(0, 10);
        const res = await getExistingOrders({ from_date: day, to_date: day });
        const raw =
          res?.data?.orders ??
          res?.data?.list ??
          res?.data?.items ??
          (Array.isArray(res?.data) ? res.data : []);
        const match = (raw || []).find(
          (r) =>
            String(r.trns_id ?? r.TRNS_ID ?? "").trim() ===
            String(baseOrderId).trim()
        );
        if (match) {
          const soNum =
            match.order_number ?? match.SO_NUM ?? match.order_id ?? match.ORDER_ID;
          if (soNum && String(soNum).trim()) {
            setDisplayOrderNumber(String(soNum).trim());
          }
        }
      } catch {
        // ignore – fall back to trns_id
      }
    },
    []
  );

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
        setOrderDetails(mapOrderDetails(res));
        const d = res?.data ?? res;
        const soNum = d?.order_number ?? d?.SO_NUM ?? d?.order_id;
        if (soNum && String(soNum).trim() && !String(soNum).match(/^\d+$/)) {
          setDisplayOrderNumber(String(soNum).trim());
        } else if (soNum) {
          setDisplayOrderNumber(String(soNum));
        } else {
          setDisplayOrderNumber(null);
          await loadOrderNumberFromExisting(orderId);
        }
      } else {
        const cached = await getCachedOrderDetail(orderId);
        setOrderDetails(mapOrderDetails({ success: true, data: cached }));
        const soNum = cached?.order_number ?? cached?.SO_NUM ?? cached?.order_id;
        if (soNum && String(soNum).trim()) setDisplayOrderNumber(String(soNum).trim());
        else setDisplayOrderNumber(null);
      }
    } catch {
      try {
        const cached = await getCachedOrderDetail(orderId);
        setOrderDetails(mapOrderDetails({ success: true, data: cached }));
        const soNum = cached?.order_number ?? cached?.SO_NUM ?? cached?.order_id;
        if (soNum && String(soNum).trim()) setDisplayOrderNumber(String(soNum).trim());
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
  const displayId = displayOrderNumber ?? orderId;

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
    const subject = `Order ${displayId} - Order Details`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
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
                <span className="text-sm text-gray-600 font-mono">Order {displayId}</span>
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

          <p className="text-gray-500 text-xs mb-6">Share order details with Super Admin</p>
          <div className="flex justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium transition-colors"
              title="Share via WhatsApp"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.172-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShareEmail}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
              title="Share via Email"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
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

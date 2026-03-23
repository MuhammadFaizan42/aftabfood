"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getExistingOrders, getOrderReview, getOrderSummary, addToCart } from "@/services/shetApi";
import { setCartTrnsId, setSaleOrderPartyCode } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { cacheExistingOrders, getCachedExistingOrders, getOfflineOrdersFromStore } from "@/lib/offline/bootstrapLoader";
import { onSyncComplete, syncPendingOrders } from "@/lib/offline/syncManager";

function formatOrderDate(val) {
  if (val == null || val === "") return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DEFAULT_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24'%3E📦%3C/text%3E%3C/svg%3E";

function formatPrice(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return "£0.00";
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeDateInput(val) {
  if (!val) return null;
  const raw = String(val).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m1 = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m2 = raw.match(/^(\d{2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (m2) {
    const [, dd, mon, yy] = m2;
    const monthMap = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
      JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    const mm = monthMap[mon.toUpperCase()] || "01";
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inDateRange(rawDate, fromDate, toDate) {
  const d = normalizeDateInput(rawDate);
  if (!d) return true;
  const from = normalizeDateInput(fromDate);
  const to = normalizeDateInput(toDate);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function buildOrderShareText(row) {
  return [
    `Order ${row.orderId}`,
    `Date: ${row.orderDate}`,
    `Customer: ${row.customerName ?? "—"}`,
    `Status: ${row.status ?? "—"}`,
    `Amount: £${Number(row.amount ?? 0).toFixed(2)}`,
  ].join("\n");
}

function mapOrderDetails(res) {
  const d = res?.data ?? res;
  if (!d || typeof d !== "object") return null;
  const rawCustomer = d.customer ?? d.customer_info ?? d.party ?? {};
  const customer = {
    ...rawCustomer,
    CUSTOMER_NAME:
      rawCustomer.CUSTOMER_NAME ??
      rawCustomer.customer_name ??
      rawCustomer.name ??
      d.party_name ??
      d.customer_name,
    SHORT_CODE:
      rawCustomer.SHORT_CODE ??
      rawCustomer.party_code ??
      rawCustomer.PARTY_CODE ??
      rawCustomer.customer_id,
    ADRES:
      rawCustomer.ADRES ??
      rawCustomer.address ??
      rawCustomer.ADDRESS ??
      [
        rawCustomer.ST,
        rawCustomer.ADRES,
        rawCustomer.DIVISION,
        rawCustomer.PROVINCES,
      ]
        .filter(Boolean)
        .join(", "),
    CONT_PERSON: rawCustomer.CONT_PERSON ?? rawCustomer.contactPerson,
    CONT_NUM: rawCustomer.CONT_NUM ?? rawCustomer.contactNum ?? rawCustomer.mobile,
  };
  const rawItems =
    d.items ?? d.lines ?? d.order_items ?? d.cart ?? d.line_items ?? (Array.isArray(d) ? d : []);
  const items = (Array.isArray(rawItems) ? rawItems : []).map((r) => ({
    name: r.product_name ?? r.PRODUCT_NAME ?? r.item_name ?? r.ITEM_NAME ?? r.name ?? "—",
    quantity: Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0,
    unitPrice: Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? r.price ?? 0) || 0,
    total:
      Number(r.line_total ?? r.LINE_TOTAL ?? r.total ?? r.amount ?? 0) || 0,
  }));
  const subtotal =
    Number(d.subtotal ?? d.sub_total ?? 0) ||
    items.reduce((s, r) => s + (r.total || r.quantity * r.unitPrice || 0), 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal =
    Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  return { customer, items, subtotal, tax, discount, grandTotal };
}

function buildDetailedShareText(displayId, row, orderDetails) {
  if (!orderDetails) return buildOrderShareText(row);
  let text = `Order ${displayId}\n`;
  const { customer, items, subtotal, tax, discount, grandTotal } = orderDetails;
  text += "\n--- CUSTOMER ---\n";
  text += `Name: ${customer?.CUSTOMER_NAME ?? "—"}\n`;
  text += `Code: ${customer?.SHORT_CODE ?? "—"}\n`;
  text += `Address: ${customer?.ADRES ?? "—"}\n`;
  text += `Contact: ${customer?.CONT_PERSON ?? "—"}\n`;
  text += `Phone: ${customer?.CONT_NUM ?? "—"}\n`;
  text += "\n--- ITEMS ---\n";
  (items || []).forEach((line, i) => {
    const qty = Number(line.quantity ?? 0);
    const price = Number(line.unitPrice ?? 0);
    const total = Number(line.total ?? qty * price);
    text += `${i + 1}. ${line.name ?? "—"} | Qty: ${qty} x £${price.toFixed(2)} = £${total.toFixed(2)}\n`;
  });
  text += "\n--- TOTALS ---\n";
  text += `Subtotal: £${Number(subtotal ?? 0).toFixed(2)}\n`;
  if (Number(tax ?? 0) !== 0) text += `Tax: £${Number(tax).toFixed(2)}\n`;
  if (Number(discount ?? 0) !== 0) text += `Discount: £${Number(discount).toFixed(2)}\n`;
  text += `Grand Total: £${Number(grandTotal ?? 0).toFixed(2)}\n`;
  return text;
}

/** Extract line items { itemId, qty, unitPrice } from order_review or order_summary response */
function getOrderLineItems(res) {
  if (!res?.data) return [];
  const d = res.data;
  const rawItems = d.items ?? d.lines ?? d.order_items ?? d.cart ?? d.line_items ?? (Array.isArray(d) ? d : []);
  const arr = Array.isArray(rawItems) ? rawItems : [];
  return arr.map((r) => {
    const itemId = String(r.item_id ?? r.product_id ?? r.PRODUCT_ID ?? r.ITEM_ID ?? r.id ?? "").trim();
    const itemName = String(
      r.item_name ??
        r.product_name ??
        r.ITEM_NAME ??
        r.PRODUCT_NAME ??
        r.name ??
        itemId ??
        "",
    ).trim();
    const image = String(r.image ?? r.IMAGE_URL ?? r.image_url ?? r.IMAGE ?? "").trim();
    const sku = String(r.sku ?? r.SKU ?? r.ITEM_CODE ?? r.CODE ?? itemId ?? "—").trim();
    const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
    const unitPrice = Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? r.price ?? 0) || 0;
    const lineAmount = Number(r.amount ?? r.line_total ?? r.LINE_TOTAL ?? (qty * unitPrice)) || 0;
    return { itemId, itemName, sku, image, qty, unitPrice, lineAmount };
  }).filter((it) => it.itemId && it.qty > 0);
}

function mapApiOrders(res) {
  if (!res?.success || !res?.data) return [];
  const raw = res.data.orders ?? res.data.list ?? res.data.items ?? (Array.isArray(res.data) ? res.data : []);
  return (Array.isArray(raw) ? raw : []).map((r, i) => {
    const orderDate = r.order_date ?? r.ORDER_DATE ?? r.created_at ?? r.date ?? r.trns_date ?? "";
    const orderId = r.order_id ?? r.ORDER_ID ?? r.order_number ?? r.trns_id ?? r.id ?? `#${i + 1}`;
    const customerName = r.customer_name ?? r.CUSTOMER_NAME ?? r.party_name ?? r.PARTY_NAME ?? r.customer ?? "—";
    const status = (r.status ?? r.STATUS ?? r.order_status ?? "Draft").toString();
    const amount = Number(r.amount ?? r.AMOUNT ?? r.total ?? r.grand_total ?? r.TOTAL ?? 0) || 0;
    const canEdit = status?.toLowerCase() === "draft" || r.can_edit === true || r.can_edit === "Y";
    const id =
      r.trns_id ??
      r.TRNS_ID ??
      r.id ??
      r.pk_id ??
      orderId ??
      i;
    const partyCode =
      r.party_code ??
      r.PARTY_CODE ??
      r.customer_id ??
      r.CUSTOMER_ID ??
      r.account_id ??
      r.ACCOUNT_ID ??
      null;
    return {
      id: id,
      orderDate: formatOrderDate(orderDate),
      orderId: String(orderId),
      customerName: String(customerName),
      status: status,
      amount,
      canEdit: !!canEdit,
      partyCode,
      _raw: r,
    };
  });
}

function mapRawToOrders(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((r, i) => {
    const orderDate = r.order_date ?? r.ORDER_DATE ?? r.created_at ?? r.date ?? r.trns_date ?? "";
    const orderId = r.backend_trns_id ?? r.order_id ?? r.ORDER_ID ?? r.order_number ?? r.trns_id ?? r.id ?? `#${i + 1}`;
    const customerName = r.customer_name ?? r.CUSTOMER_NAME ?? r.party_name ?? r.PARTY_NAME ?? r.customer ?? "—";
    const status = (r.status ?? r.STATUS ?? r.order_status ?? "Draft").toString();
    const amount = Number(r.amount ?? r.AMOUNT ?? r.total ?? r.grand_total ?? r.TOTAL ?? 0) || 0;
    const canEdit = status?.toLowerCase() === "draft" || r.can_edit === true || r.can_edit === "Y";
    const id = r.trns_id ?? r.TRNS_ID ?? r.id ?? r.pk_id ?? orderId ?? i;
    const partyCode = r.party_code ?? r.PARTY_CODE ?? r.customer_id ?? r.CUSTOMER_ID ?? r.account_id ?? r.ACCOUNT_ID ?? null;
    return {
      id,
      orderDate: formatOrderDate(orderDate),
      orderId: String(orderId),
      customerName: String(customerName),
      status,
      amount,
      canEdit: !!canEdit,
      partyCode,
      _raw: r,
    };
  });
}

function ExistingOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyCodeParam = searchParams.get("party_code");
  const customerNameParam = searchParams.get("customer_name") || "";
  const isOnline = useOnlineStatus();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appliedFromDate, setAppliedFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [appliedToDate, setAppliedToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [viewLoading, setViewLoading] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const res = await getExistingOrders({
          from_date: appliedFromDate || undefined,
          to_date: appliedToDate || undefined,
          ...(partyCodeParam && { party_code: partyCodeParam }),
        });
        let apiOrders = mapApiOrders(res);
        apiOrders = apiOrders.filter((o) =>
          inDateRange(
            o._raw?.order_date ??
              o._raw?.ORDER_DATE ??
              o._raw?.dated ??
              o._raw?.DATED ??
              o._raw?.created_at ??
              o._raw?.date,
            appliedFromDate,
            appliedToDate,
          ),
        );
        try {
          await cacheExistingOrders(res);
        } catch {
          // ignore cache errors
        }
        const offlineOnly = await getOfflineOrdersFromStore();
        let offlineOrders = mapRawToOrders(offlineOnly);
        offlineOrders = offlineOrders.filter((o) =>
          inDateRange(
            o._raw?.order_date ??
              o._raw?.ORDER_DATE ??
              o._raw?._orderDateStr ??
              o._raw?.dated ??
              o._raw?.DATED ??
              o._raw?.created_at ??
              o._raw?.date,
            appliedFromDate,
            appliedToDate,
          ),
        );
        // Deduplicate: same order can appear from API (SO number) and from IDB (synced with backend_trns_id). Keep only API row (SO) and drop IDB row with same backend_trns_id.
        const apiTrnsIds = new Set(
          apiOrders
            .map((o) => o._raw?.trns_id ?? o._raw?.TRNS_ID ?? o.id)
            .filter((v) => v != null && v !== "")
            .map((v) => String(v))
        );
        const offlineDeduped = offlineOrders.filter((o) => {
          const bid = o._raw?.backend_trns_id;
          if (bid == null) return true;
          return !apiTrnsIds.has(String(bid));
        });
        let merged = [...apiOrders, ...offlineDeduped].sort((a, b) => {
          const dA = a._raw?.order_date ?? a._raw?._orderDateStr ?? "";
          const dB = b._raw?.order_date ?? b._raw?._orderDateStr ?? "";
          return String(dB).localeCompare(String(dA));
        });
        if (partyCodeParam) {
          const pc = String(partyCodeParam).trim();
          merged = merged.filter((o) => String(o.partyCode ?? "").trim() === pc);
        }
        setOrders(merged);
      } else {
        const cached = await getCachedExistingOrders(appliedFromDate, appliedToDate);
        let list = mapRawToOrders(cached);
        list = list.filter((o) =>
          inDateRange(
            o._raw?.order_date ??
              o._raw?.ORDER_DATE ??
              o._raw?._orderDateStr ??
              o._raw?.dated ??
              o._raw?.DATED ??
              o._raw?.created_at ??
              o._raw?.date,
            appliedFromDate,
            appliedToDate,
          ),
        );
        if (partyCodeParam) {
          const pc = String(partyCodeParam).trim();
          list = list.filter((o) => String(o.partyCode ?? "").trim() === pc);
        }
        setOrders(list);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load existing orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, appliedToDate, isOnline, partyCodeParam]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const unsubscribe = onSyncComplete((result) => {
      setSyncing(false);
      if (result?.synced > 0) {
        setSyncMessage(`Synced ${result.synced} order(s). Order IDs updated.`);
        loadOrders();
        if (typeof window !== "undefined") {
          setTimeout(() => setSyncMessage(null), 4000);
        }
      }
      if (result?.failed > 0 && result?.synced === 0) {
        setSyncMessage(result?.error || "Some orders could not be synced.");
        setTimeout(() => setSyncMessage(null), 5000);
      }
    });
    return unsubscribe;
  }, [loadOrders]);

  useEffect(() => {
    if (!isOnline) return;
    setSyncing(true);
    syncPendingOrders()
      .finally(() => setSyncing(false));
  }, [isOnline]);

  const handleDuplicateOrder = useCallback(async (row) => {
    const orderId = row.id;
    const pc = row.partyCode ?? row._raw?.party_code ?? row._raw?.PARTY_CODE ?? partyCodeParam;
    if (!pc) {
      setDuplicateError("Customer not found for this order.");
      return;
    }
    if (String(orderId).startsWith("offline_")) {
      setDuplicateError("Duplicate when online. Opening order in cart.");
      setSaleOrderPartyCode(pc);
      setCartTrnsId(orderId);
      router.push("/cart");
      return;
    }
    setDuplicateLoading(orderId);
    setDuplicateError(null);
    try {
      let items = [];
      try {
        const res = await getOrderReview(orderId);
        items = getOrderLineItems(res);
      } catch {
        const res = await getOrderSummary(orderId);
        items = getOrderLineItems(res);
      }
      if (!items.length) {
        setDuplicateError("No items found in this order.");
        setDuplicateLoading(null);
        return;
      }
      let newTrnsId = null;
      for (const it of items) {
        const res = await addToCart(pc, it.itemId, it.qty, newTrnsId, { unit_price: it.unitPrice });
        newTrnsId = res?.data?.trns_id ?? res?.trns_id ?? newTrnsId;
      }
      if (newTrnsId) setCartTrnsId(newTrnsId);
      setSaleOrderPartyCode(pc);
      setDuplicateLoading(null);
      router.push("/cart");
    } catch (err) {
      setDuplicateError(err instanceof Error ? err.message : "Failed to duplicate order.");
      setDuplicateLoading(null);
    }
  }, [partyCodeParam, router]);

  const handleViewOrder = useCallback(async (row) => {
    const orderId = row.id;
    setViewLoading(orderId);
    setViewError(null);
    try {
      let items = [];
      let sourceRes = null;
      try {
        sourceRes = await getOrderReview(orderId);
        items = getOrderLineItems(sourceRes);
      } catch {
        sourceRes = await getOrderSummary(orderId);
        items = getOrderLineItems(sourceRes);
      }
      if (!items.length) {
        setViewError("No item details found for this order.");
      }
      setViewOrder({
        orderId: row.orderId,
        date: row.orderDate,
        amount: row.amount,
        status: row.status,
        items,
        raw: sourceRes?.data ?? null,
      });
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Failed to load order details.");
      setViewOrder(null);
    } finally {
      setViewLoading(null);
    }
  }, []);

  const applyDateFilters = useCallback(() => {
    if (fromDate && toDate && normalizeDateInput(fromDate) && normalizeDateInput(toDate)) {
      if (normalizeDateInput(fromDate) > normalizeDateInput(toDate)) {
        setError("From date cannot be greater than To date.");
        return;
      }
    }
    setError(null);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  }, [fromDate, toDate]);

  const fetchOrderShareText = useCallback(async (row) => {
    const orderId = row.id;
    let details = null;
    try {
      const reviewRes = await getOrderReview(orderId);
      details = mapOrderDetails(reviewRes);
    } catch {
      try {
        const summaryRes = await getOrderSummary(orderId);
        details = mapOrderDetails(summaryRes);
      } catch {
        details = null;
      }
    }
    return buildDetailedShareText(row.orderId, row, details);
  }, []);

  const handleShareWhatsApp = useCallback(async (row) => {
    const text = await fetchOrderShareText(row);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [fetchOrderShareText]);

  const handleShareEmail = useCallback(async (row) => {
    const subject = `Order ${row.orderId} Details`;
    const body = await fetchOrderShareText(row);
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }, [fetchOrderShareText]);

  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

  const isCustomerView = !!partyCodeParam;

  const columnsCustomerView = [
    {
      header: "Order #",
      accessor: "orderId",
      width: "140px",
      render: (row) => <span className="text-gray-900 font-medium">{row.orderId}</span>,
    },
    {
      header: "Date",
      accessor: "orderDate",
      width: "140px",
      render: (row) => <span className="text-gray-600">{row.orderDate}</span>,
    },
    {
      header: "Amount",
      accessor: "amount",
      width: "120px",
      render: (row) => (
        <span className="text-gray-900 font-semibold">
          £{Number(row.amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      width: "130px",
      render: (row) => {
        const s = (row.status || "").toString();
        const statusClass =
          s === "Synced" ? "text-green-700 bg-green-50"
            : s === "Offline" ? "text-amber-700 bg-amber-50"
              : s.toLowerCase() === "completed" ? "text-green-700 bg-green-50"
                : "text-gray-500 bg-gray-100";
        return (
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${statusClass}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Action",
      accessor: "action",
      width: "140px",
      minWidth: "140px",
      render: (row) => {
        const isDuplicating = duplicateLoading === row.id;
        const isViewing = viewLoading === row.id;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isViewing}
              className="cursor-pointer flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
              onClick={() => handleViewOrder(row)}
            >
              {isViewing ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isDuplicating}
              className="cursor-pointer flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
              onClick={() => handleDuplicateOrder(row)}
            >
              {isDuplicating ? (
                <span className="animate-pulse">Adding...</span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicate
                </>
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const columnsFull = [
    {
      header: "Order Date",
      accessor: "orderDate",
      width: "1fr",
      render: (row) => <span className="text-gray-900">{row.orderDate}</span>,
    },
    {
      header: "Order ID",
      accessor: "orderId",
      width: "1fr",
      render: (row) => <span className="text-gray-900">{row.orderId}</span>,
    },
    {
      header: "Customer Name",
      accessor: "customerName",
      width: "1.5fr",
      render: (row) => <span className="text-gray-900">{row.customerName}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      width: "1fr",
      render: (row) => {
        const s = (row.status || "").toString();
        const statusClass =
          s === "Synced" ? "bg-green-100 text-green-700"
            : s === "Offline" ? "bg-amber-100 text-amber-700"
              : s === "Draft" ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700";
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Amount",
      accessor: "amount",
      width: "1fr",
      render: (row) => (
        <span className="font-semibold text-gray-900">
          £{Number(row.amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      width: "1fr",
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            className="cursor-pointer p-2 text-[#25D366] hover:bg-green-50 rounded-lg transition-colors"
            title="Share via WhatsApp"
            onClick={() => handleShareWhatsApp(row)}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.172-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
          <button
            className="cursor-pointer p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Share via Email"
            onClick={() => handleShareEmail(row)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            className="cursor-pointer p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Detail"
            onClick={() => {
              const partyCode =
                row.partyCode ??
                row._raw?.party_code ??
                row._raw?.PARTY_CODE ??
                row._raw?.customer_id ??
                row._raw?.CUSTOMER_ID ??
                row._raw?.account_id ??
                row._raw?.ACCOUNT_ID ??
                null;
              if (partyCode) setSaleOrderPartyCode(partyCode);
              const trnsIdForNav = row._raw?.backend_trns_id ?? row.id;
              if (trnsIdForNav != null) setCartTrnsId(trnsIdForNav);
              router.push("/review?mode=view");
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {row.canEdit && (
            <button
              className="cursor-pointer p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
              onClick={() => {
                const partyCode =
                  row.partyCode ?? row._raw?.party_code ?? row._raw?.PARTY_CODE ?? row._raw?.customer_id ?? row._raw?.CUSTOMER_ID ?? row._raw?.account_id ?? row._raw?.ACCOUNT_ID ?? null;
                if (partyCode) setSaleOrderPartyCode(partyCode);
                const trnsIdForNav = row._raw?.backend_trns_id ?? row.id;
                if (trnsIdForNav != null) setCartTrnsId(trnsIdForNav);
                router.push("/cart");
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  const columns = isCustomerView ? columnsCustomerView : columnsFull;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push(isCustomerView && partyCodeParam ? `/customer-dashboard?party_code=${encodeURIComponent(partyCodeParam)}` : "/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
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
          <span className="font-medium">{isCustomerView ? "Back to Customer Dashboard" : "Back to Dashboard"}</span>
        </button>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCustomerView ? "Previous Orders" : "Existing Orders"}
            </h1>
            {isCustomerView && customerNameParam && (
              <p className="text-gray-500 mt-1">Orders for {customerNameParam}</p>
            )}
          </div>
          {!isOnline && (
            <span className="text-sm text-amber-600 font-medium">
              Offline – using cached data
            </span>
          )}
        </div>

        {/* Date Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            {/* From Date */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* To Date */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Apply Filters Button */}
            <div className="flex-1 sm:flex-none">
              <button
                type="button"
                onClick={applyDateFilters}
                disabled={loading}
                className="cursor-pointer w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-8 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Loading..." : "Apply Filters"}</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}
        {viewError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6 flex items-center justify-between gap-2">
            <span>{viewError}</span>
            <button type="button" onClick={() => setViewError(null)} className="text-red-600 hover:text-red-900 font-medium">×</button>
          </div>
        )}
        {duplicateError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-6 flex items-center justify-between gap-2">
            <span>{duplicateError}</span>
            <button type="button" onClick={() => setDuplicateError(null)} className="text-amber-600 hover:text-amber-900 font-medium">×</button>
          </div>
        )}
        {syncing && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-blue-700 text-sm mb-4 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Syncing offline orders… Order IDs will update when done.
          </div>
        )}
        {syncMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-green-800 text-sm mb-4">
            {syncMessage}
          </div>
        )}

        {/* Orders Table */}
        {loading && orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading existing orders...</div>
        ) : (
          <ReusableTable
            columns={columns}
            data={orders}
            rowsPerPage={5}
            totalAmount={`£${totalAmount.toLocaleString("en-GB", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            totalLabel="Total Collected Amount"
          />
        )}
        {viewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-500">
                    {viewOrder.orderId} · {viewOrder.date}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="text-gray-500 hover:text-gray-900 text-xl leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto max-h-[calc(90vh-72px)]">
                {viewOrder.items.length === 0 ? (
                  <p className="text-sm text-gray-500">No items found for this order.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-3">
                      {viewOrder.items.map((it, idx) => (
                        <div key={`${it.itemId}_${idx}`} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={it.image || DEFAULT_IMG}
                                  alt={it.itemName || it.itemId}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = DEFAULT_IMG;
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {it.itemName || "—"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  SKU: {it.sku || it.itemId}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  Item ID: {it.itemId}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-right min-w-[260px]">
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">Qty</div>
                                <div className="text-sm font-medium text-gray-900">{it.qty}</div>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">Rate</div>
                                <div className="text-sm font-medium text-gray-900">{formatPrice(it.unitPrice)}</div>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">Total</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatPrice(it.lineAmount || it.qty * it.unitPrice || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-1">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Payment Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Items</span>
                            <span className="font-medium text-gray-900">{viewOrder.items.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(viewOrder.items.reduce((s, i) => s + (Number(i.lineAmount) || Number(i.qty) * Number(i.unitPrice) || 0), 0))}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">Order Total</span>
                            <span className="text-lg font-bold text-gray-900">{formatPrice(viewOrder.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExistingOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
      <ExistingOrdersContent />
    </Suspense>
  );
}

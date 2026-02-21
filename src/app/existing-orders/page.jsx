"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getExistingOrders, getOrderReview, getOrderSummary, addToCart } from "@/services/shetApi";
import { setCartTrnsId, setSaleOrderPartyCode } from "@/lib/api";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { cacheExistingOrders, getCachedExistingOrders, getOfflineOrdersFromStore } from "@/lib/offline/bootstrapLoader";

function formatOrderDate(val) {
  if (val == null || val === "") return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Extract line items { itemId, qty, unitPrice } from order_review or order_summary response */
function getOrderLineItems(res) {
  if (!res?.data) return [];
  const d = res.data;
  const rawItems = d.items ?? d.lines ?? d.order_items ?? d.cart ?? d.line_items ?? (Array.isArray(d) ? d : []);
  const arr = Array.isArray(rawItems) ? rawItems : [];
  return arr.map((r) => {
    const itemId = String(r.item_id ?? r.product_id ?? r.PRODUCT_ID ?? r.ITEM_ID ?? r.id ?? "").trim();
    const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
    const unitPrice = Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? r.price ?? 0) || 0;
    return { itemId, qty, unitPrice };
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
      orderId: String(orderId).startsWith("#") ? orderId : `#${orderId}`,
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
    const orderId = r.order_id ?? r.ORDER_ID ?? r.order_number ?? r.trns_id ?? r.id ?? `#${i + 1}`;
    const customerName = r.customer_name ?? r.CUSTOMER_NAME ?? r.party_name ?? r.PARTY_NAME ?? r.customer ?? "—";
    const status = (r.status ?? r.STATUS ?? r.order_status ?? "Draft").toString();
    const amount = Number(r.amount ?? r.AMOUNT ?? r.total ?? r.grand_total ?? r.TOTAL ?? 0) || 0;
    const canEdit = status?.toLowerCase() === "draft" || r.can_edit === true || r.can_edit === "Y";
    const id = r.trns_id ?? r.TRNS_ID ?? r.id ?? r.pk_id ?? orderId ?? i;
    const partyCode = r.party_code ?? r.PARTY_CODE ?? r.customer_id ?? r.CUSTOMER_ID ?? r.account_id ?? r.ACCOUNT_ID ?? null;
    return {
      id,
      orderDate: formatOrderDate(orderDate),
      orderId: String(orderId).startsWith("#") ? orderId : `#${orderId}`,
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const res = await getExistingOrders({
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          ...(partyCodeParam && { party_code: partyCodeParam }),
        });
        const apiOrders = mapApiOrders(res);
        try {
          await cacheExistingOrders(res);
        } catch {
          // ignore cache errors
        }
        const offlineOnly = await getOfflineOrdersFromStore();
        const offlineOrders = mapRawToOrders(offlineOnly);
        let merged = [...apiOrders, ...offlineOrders].sort((a, b) => {
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
        const cached = await getCachedExistingOrders(fromDate, toDate);
        let list = mapRawToOrders(cached);
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
  }, [fromDate, toDate, isOnline, partyCodeParam]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
      render: (row) => (
        <span
          className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${
            (row.status || "").toLowerCase() === "completed" ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      width: "140px",
      minWidth: "140px",
      render: (row) => {
        const isDuplicating = duplicateLoading === row.id;
        return (
          <button
            type="button"
            disabled={isDuplicating}
            className="cursor-pointer flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
            onClick={() => handleDuplicateOrder(row)}
          >
            {isDuplicating ? (
              <span className="animate-pulse">Adding…</span>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </>
            )}
          </button>
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
      render: (row) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${row.status === "Draft"
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700"
            }`}
        >
          {row.status}
        </span>
      ),
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
              if (row.id != null) setCartTrnsId(row.id);
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
                if (row.id != null) setCartTrnsId(row.id);
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
                onClick={loadOrders}
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
        {duplicateError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-6 flex items-center justify-between gap-2">
            <span>{duplicateError}</span>
            <button type="button" onClick={() => setDuplicateError(null)} className="text-amber-600 hover:text-amber-900 font-medium">×</button>
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

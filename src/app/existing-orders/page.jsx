"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getExistingOrders } from "@/services/shetApi";

function formatOrderDate(val) {
  if (val == null || val === "") return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
    return {
      id: r.id ?? r.trns_id ?? r.pk_id ?? orderId ?? i,
      orderDate: formatOrderDate(orderDate),
      orderId: String(orderId).startsWith("#") ? orderId : `#${orderId}`,
      customerName: String(customerName),
      status: status,
      amount,
      canEdit: !!canEdit,
      _raw: r,
    };
  });
}

export default function ExistingOrders() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExistingOrders({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setOrders(mapApiOrders(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load existing orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

  const columns = [
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
            onClick={() => router.push("/review")}
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          {row.canEdit && (
            <button
              className="cursor-pointer p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
              onClick={() => router.push("/cart")}
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push("/dashboard")}
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
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Existing Orders
        </h1>

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

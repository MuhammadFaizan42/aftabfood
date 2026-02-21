"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getVisits, getVisitsByPartyCode, getReasonLabel } from "@/lib/visits";
import { getSalesVisitHistory } from "@/services/shetApi";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

function formatVisitDate(val) {
  if (val == null || val === "") return "—";
  const d = new Date(val + "T12:00:00");
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function VisitHistoryContent() {
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
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];
      if (partyCodeParam && isOnline) {
        const res = await getSalesVisitHistory(partyCodeParam, partyCodeParam);
        const items = res?.data?.items;
        if (Array.isArray(items)) {
          const from = String(fromDate || "").slice(0, 10);
          const to = String(toDate || "").slice(0, 10);
          list = items
            .filter((v) => {
              const d = String(v.visit_date || "").slice(0, 10);
              if (from && d < from) return false;
              if (to && d > to) return false;
              return true;
            })
            .sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""))
            .map((item) => ({
              id: item.visit_id || item.visit_date + "_" + (item.visit_id ?? ""),
              customer_name: customerNameParam || "—",
              visit_date: item.visit_date || "",
              order_placed: item.order_placed === true || item.order_placed_raw === "1" || item.order_placed === "Y",
              no_order_reason: item.no_order_reason || null,
              remarks: item.remarks || "",
            }));
        }
      } else if (partyCodeParam) {
        list = await getVisitsByPartyCode(partyCodeParam, 0);
        const from = String(fromDate || "").slice(0, 10);
        const to = String(toDate || "").slice(0, 10);
        if (from || to) {
          list = list.filter((v) => {
            const d = String(v.visit_date || "").slice(0, 10);
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          });
        }
        list = list.map((v) => ({ ...v, customer_name: v.customer_name || customerNameParam || "—" }));
      } else {
        list = await getVisits(fromDate || undefined, toDate || undefined);
      }
      setVisits(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visit history.");
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, partyCodeParam, customerNameParam, isOnline]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const columns = [
    {
      header: "Customer name",
      accessor: "customer_name",
      width: "200px",
      minWidth: "180px",
      render: (row) => (
        <div className="font-medium text-gray-900">
          {row.customer_name || "—"}
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "visit_date",
      width: "120px",
      minWidth: "100px",
      render: (row) => (
        <div className="text-gray-700">
          {formatVisitDate(row.visit_date)}
        </div>
      ),
    },
    {
      header: "Order placed?",
      accessor: "order_placed",
      width: "120px",
      minWidth: "100px",
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            row.order_placed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.order_placed ? "Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Reason (no order)",
      accessor: "no_order_reason",
      width: "180px",
      minWidth: "160px",
      render: (row) => (
        <div className="text-gray-700 text-sm">
          {row.order_placed ? "—" : getReasonLabel(row.no_order_reason)}
        </div>
      ),
    },
    {
      header: "Remarks",
      accessor: "remarks",
      width: "280px",
      minWidth: "200px",
      render: (row) => (
        <div className="text-gray-600 text-sm max-w-xs truncate" title={row.remarks || ""}>
          {row.order_placed ? "—" : (row.remarks || "—")}
        </div>
      ),
    },
  ];

  const tableData = visits.map((v) => ({
    id: v.id,
    customer_name: v.customer_name,
    visit_date: v.visit_date,
    order_placed: v.order_placed,
    no_order_reason: v.no_order_reason,
    remarks: v.remarks,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Visit History</h1>
        <p className="text-sm text-gray-500 mb-6">
          {partyCodeParam
            ? "Visits for this customer. Use date range to filter."
            : "All customer visits with or without order. Use date range to filter."}
        </p>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
          </div>
          <button
            onClick={loadVisits}
            className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            Apply
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading visit history...</div>
        ) : tableData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-2">No visits in this date range.</p>
            <p className="text-sm text-gray-500">
              Record &quot;No order – Add remarks&quot; from a customer dashboard to see entries here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-4"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ReusableTable columns={columns} data={tableData} showPagination={true} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function VisitHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <VisitHistoryContent />
    </Suspense>
  );
}

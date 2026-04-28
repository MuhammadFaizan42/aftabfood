"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/common/Header";
import ReusableTable from "@/components/common/ReusableTable";
import { getPartySaleInvDashboard } from "@/services/shetApi";

function formatAmount(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Drill-down uses only `recent_invoices` — not `recent_orders`. */
function mapRecentInvoices(data) {
  const raw = Array.isArray(data?.recent_invoices) ? data.recent_invoices : [];

  return raw.map((o) => ({
    orderNum:
      o.INVOICE_NO ??
      o.BRV_NUM ??
      o.INV_NUM ??
      o.invoice_no ??
      "—",
    date:
      o.INVOICE_DATE ??
      o.DATED ??
      o.invoice_date ??
      o.date ??
      "—",
    amount: formatAmount(
      o.INVOICE_AMT ?? o.LC_AMT ?? o.AMOUNT ?? o.amount,
    ),
    status:
      o.STATUS_RAW ??
      o.STATUS ??
      o.status ??
      o.invoice_status ??
      "—",
  }));
}

export default function TotalSalesInvoicesClient() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get("party_code");
  const customerName = searchParams.get("customer_name") || "";

  const [loading, setLoading] = useState(!!partyCode);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!partyCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPartySaleInvDashboard(partyCode, {
        recent_limit: 50,
      });
      if (!res?.success || !res?.data) {
        setError(res?.message || "Could not load sales data.");
        setSummary(null);
        setRows([]);
        return;
      }
      const d = res.data;
      setSummary(d.summary || null);
      setRows(mapRecentInvoices(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [partyCode]);

  useEffect(() => {
    load();
  }, [load]);

  const backHref = partyCode
    ? `/customer-dashboard?party_code=${encodeURIComponent(partyCode)}`
    : "/new-order";

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            No customer selected. Open this page from the dashboard (Total Sales
            Amount).
          </div>
          <Link
            href="/new-order"
            className="inline-flex mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Back to customers
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
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
          Back to Customer Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Total sales — invoices
        </h1>
        {customerName && customerName !== "—" && (
          <p className="text-gray-600 mb-6">{customerName}</p>
        )}

        {summary && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total sales amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(summary.total_sales_amount)}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent invoices (recent_invoices)
            </h2>
            <ReusableTable
              columns={[
                {
                  header: "Invoice #",
                  accessor: "orderNum",
                  width: "180px",
                  render: (row) => (
                    <span className="text-gray-900 font-medium">
                      {row.orderNum}
                    </span>
                  ),
                },
                {
                  header: "Date",
                  accessor: "date",
                  width: "140px",
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  width: "120px",
                },
                {
                  header: "Status",
                  accessor: "status",
                  width: "120px",
                },
              ]}
              data={rows}
            />
            {rows.length === 0 && !error && (
              <p className="text-sm text-gray-500 mt-4">No rows returned.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

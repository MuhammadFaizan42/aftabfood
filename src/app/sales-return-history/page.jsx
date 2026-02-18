"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getSaleReturns } from "@/services/shetApi";
import { getPartySaleInvDashboard } from "@/services/shetApi";
import { clearAuthToken } from "@/lib/api";

function formatAmount(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesReturnHistory() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get("party_code");

  const [returns, setReturns] = useState([]);
  const [totalReturnedAmount, setTotalReturnedAmount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: "—",
    initials: "—",
    customerId: partyCode || "—",
    location: "—",
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(!!partyCode);
  const [error, setError] = useState(null);

  const fetchReturns = useCallback(async () => {
    if (!partyCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSaleReturns(partyCode, {
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
      });
      if (!res?.success) {
        setReturns([]);
        setTotalReturnedAmount(0);
        const msg = res?.message || "";
        if (msg.toLowerCase().includes("token expired") || msg.toLowerCase().includes("unauthorized")) {
          clearAuthToken();
          setError("Session expired. Please log in again.");
        } else if (msg) {
          setError(msg);
        }
        return;
      }
      const raw = res.data;
      const data = raw?.items ?? raw?.returns ?? (Array.isArray(raw) ? raw : raw?.records ?? raw?.list ?? raw?.data ?? []);
      const list = Array.isArray(data) ? data : [];
      const rows = list.map((r) => {
        const returnNo = r.SR_INV_NUM ?? r.RETURN_NO ?? r.RET_NO ?? r.returnNo ?? r.DOC_NO ?? "—";
        const date = r.DATED ?? r.DATE ?? r.date ?? "—";
        const refInvoice = r.INV_NUMBER ?? r.REF_INVOICE ?? r.INVOICE_REF ?? r.refInvoice ?? r.BRV_NUM ?? "—";
        const reason = r.REASON ?? r.reason ?? r.REMARKS ?? "—";
        const amt = r.CR ?? r.LC_AMT ?? r.AMOUNT ?? r.RETURN_AMT ?? r.amount ?? r.INVOICE_AMT ?? 0;
        const amount = formatAmount(amt);
        return { returnNo, date, refInvoice, reason, amount, _raw: r };
      });
      setReturns(rows);
      const total = raw?.total_amount != null ? Number(raw.total_amount) : list.reduce((sum, r) => sum + (Number(r.CR ?? r.LC_AMT ?? r.AMOUNT ?? r.amount) || 0), 0);
      setTotalReturnedAmount(total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load sale returns.";
      if (msg.toLowerCase().includes("token expired") || msg.toLowerCase().includes("unauthorized")) {
        clearAuthToken();
        setError("Session expired. Please log in again.");
      } else {
        setError(msg);
      }
      setReturns([]);
      setTotalReturnedAmount(0);
    } finally {
      setLoading(false);
    }
  }, [partyCode, fromDate, toDate]);

  useEffect(() => {
    if (!partyCode) {
      setLoading(false);
      return;
    }
    fetchReturns();
  }, [partyCode]);

  useEffect(() => {
    if (!partyCode) return;
    let cancelled = false;
    getPartySaleInvDashboard(partyCode)
      .then((res) => {
        if (cancelled || !res?.success || !res?.data?.customer) return;
        const c = res.data.customer;
        const name = c.CUSTOMER_NAME || "—";
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "—";
        const location = [c.ST, c.ADRES, c.DIVISION].filter(Boolean).join(", ") || "—";
        setCustomerInfo((prev) => ({ ...prev, name, initials, customerId: partyCode, location }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [partyCode]);

  const handleApply = () => {
    fetchReturns();
  };
  const handleReset = () => {
    setFromDate("");
    setToDate("");
  };

  const displayTotal = formatAmount(totalReturnedAmount);

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            No customer selected. Please open this page from a customer dashboard.
          </div>
          <Link href="/new-order" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4">
            Back to Customers
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back Button and Title */}
        <div className="mb-6">
          <Link
            href={partyCode ? `/customer-dashboard?party_code=${encodeURIComponent(partyCode)}` : "/customer-dashboard"}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
            Back to Ledger
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sales Return History
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Detailed breakdown of returned items and credit notes
          </p>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* Profile Avatar with Initials - Centered on mobile */}
              <div className="flex justify-center sm:justify-start">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-lg sm:text-xl">
                    {customerInfo.initials}
                  </span>
                </div>
              </div>
              {/* Name and Details */}
              <div className="text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {customerInfo.name}
                </h2>
                <div className="flex flex-col sm:flex-row items-start gap-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">#</span>
                    <span>{customerInfo.customerId}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{customerInfo.location}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Total Returned Amount */}
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Returned Amount</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {displayTotal}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-4">
            <p>{error}</p>
            {error === "Session expired. Please log in again." && (
              <Link href="/" className="inline-block mt-2 font-medium text-red-800 hover:underline">
                Log in again →
              </Link>
            )}
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-44"
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-44"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="cursor-pointer h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="cursor-pointer h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        {loading && returns.length === 0 && (
          <div className="text-center py-12 text-gray-500">Loading sale returns...</div>
        )}

        {/* Returns Table */}
        {!loading && (
        <ReusableTable
          columns={[
            {
              header: "Return No.",
              accessor: "returnNo",
              width: "180px",
              render: (row) => (
                <span className="text-black">{row.returnNo}</span>
              ),
            },
            {
              header: "Date",
              accessor: "date",
              width: "150px",
              render: (row) => (
                <span className="text-black">{row.date}</span>
              ),
            },
            {
              header: "Ref Invoice",
              accessor: "refInvoice",
              width: "180px",
              render: (row) => (
                <span className="text-black">{row.refInvoice}</span>
              ),
            },
            {
              header: "Reason",
              accessor: "reason",
              width: "200px",
              render: (row) => {
                // Color scheme based on reason type
                const getReasonColor = (reason) => {
                  if (reason === "Damaged Goods") return "text-red-600";
                  if (reason === "Expired") return "text-red-600";
                  if (reason === "Wrong Item") return "text-blue-600";
                  if (reason === "Short Expiry") return "text-yellow-600";
                  return "text-blue-600";
                };

                return (
                  <span className={`${getReasonColor(row.reason)} hover:opacity-80 cursor-pointer`}>
                    {row.reason}
                  </span>
                );
              },
            },
            {
              header: "Amount",
              accessor: "amount",
              width: "150px",
              render: (row) => (
                <span className="text-black font-semibold block">
                  {row.amount}
                </span>
              ),
            },
          ]}
          data={returns}
          rowsPerPage={10}
        />
        )}
      </main>
    </div>
  );
}

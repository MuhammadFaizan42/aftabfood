"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getPartySaleInvDashboard, createSalesVisit, getSalesVisitHistory } from "@/services/shetApi";
import { setSaleOrderPartyCode, clearCartTrnsId } from "@/lib/api";
import { cacheCustomerDashboard, getCachedCustomerDashboard, getCachedCustomers, cacheVisitHistory, getCachedVisitHistory } from "@/lib/offline/bootstrapLoader";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { saveVisit, NO_ORDER_REASONS, getVisitsByPartyCode, getReasonLabel } from "@/lib/visits";

function formatCustomerAddress(c) {
  if (!c) return "—";
  const parts = [c.ST, c.ADRES, c.DIVISION, c.PROVINCES].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function formatAmount(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CustomerDashboardClient() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get("party_code");
  const isOnline = useOnlineStatus();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!partyCode);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [searchItems, setSearchItems] = useState("");
  const [showNoOrderModal, setShowNoOrderModal] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [noOrderReason, setNoOrderReason] = useState("");
  const [visitRemarks, setVisitRemarks] = useState("");
  const [visitSubmitLoading, setVisitSubmitLoading] = useState(false);
  const [visitSubmitSuccess, setVisitSubmitSuccess] = useState(false);
  const [visitSubmitError, setVisitSubmitError] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showCachedBanner, setShowCachedBanner] = useState(false);

  const loadDashboard = React.useCallback(async () => {
    if (!partyCode) return;
    setLoading(true);
    setError(null);
    setShowCachedBanner(false);
    try {
      if (isOnline) {
        const params = {
          recent_limit: 10,
          ...(appliedFrom && { from_date: appliedFrom }),
          ...(appliedTo && { to_date: appliedTo }),
        };
        let res;
        try {
          res = await getPartySaleInvDashboard(partyCode, params);
        } catch (apiErr) {
          const cached = await getCachedCustomerDashboard(partyCode);
          if (cached) {
            setData(cached);
            setShowCachedBanner(true);
          } else {
            setError(apiErr instanceof Error ? apiErr.message : "Could not reach server. Open this page once when online to cache for offline.");
            setData(null);
          }
          return;
        }
        if (!res?.success || !res?.data) {
          const cached = await getCachedCustomerDashboard(partyCode);
          if (cached) {
            setData(cached);
            setShowCachedBanner(true);
          } else {
            setError(res?.message || "Failed to load dashboard.");
            setData(null);
          }
          return;
        }
        setData(res.data);
        try {
          await cacheCustomerDashboard(partyCode, res.data);
        } catch {
          // ignore cache errors
        }
      } else {
        const cached = await getCachedCustomerDashboard(partyCode);
        if (cached) {
          setData(cached);
        } else {
          let customerLabel = partyCode;
          try {
            const customers = await getCachedCustomers();
            const c = customers.find(
              (x) => String(x.SHORT_CODE ?? x.CUSTOMER_ID ?? x.PARTY_CODE ?? x.code ?? "").trim() === String(partyCode).trim()
            );
            if (c) customerLabel = c.CUSTOMER_NAME ?? c.PARTY_NAME ?? c.SHORT_CODE ?? partyCode;
          } catch {
            // keep customerLabel as partyCode
          }
          setError(`No cached data for ${customerLabel}. Open this page once when online on this device to use offline.`);
          setData(null);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [partyCode, appliedFrom, appliedTo, isOnline]);

  useEffect(() => {
    if (!partyCode) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [partyCode, appliedFrom, appliedTo, loadDashboard]);

  const loadRecentVisits = React.useCallback(async () => {
    if (!partyCode) return;
    if (isOnline) {
      try {
        const res = await getSalesVisitHistory(partyCode, partyCode);
        try {
          await cacheVisitHistory(partyCode, res?.data ?? res);
        } catch { /* ignore */ }
        const items = res?.data?.items;
        if (Array.isArray(items)) {
          const sorted = [...items].sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
          const mapped = sorted.slice(0, 10).map((item) => ({
            id: item.visit_id || item.visit_date + "_" + (item.visit_id ?? ""),
            visit_date: item.visit_date || "",
            order_placed: item.order_placed === true || item.order_placed_raw === "1" || item.order_placed === "Y",
            no_order_reason: item.no_order_reason || null,
            remarks: item.remarks || "",
          }));
          setRecentVisits(mapped);
        } else {
          setRecentVisits([]);
        }
      } catch {
        const list = await getVisitsByPartyCode(partyCode, 10);
        setRecentVisits(list);
      }
    } else {
      const cached = await getCachedVisitHistory(partyCode);
      if (Array.isArray(cached) && cached.length > 0) {
        const sorted = [...cached].sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
        const mapped = sorted.slice(0, 10).map((item) => ({
          id: item.visit_id || item.visit_date + "_" + (item.visit_id ?? ""),
          visit_date: item.visit_date || "",
          order_placed: item.order_placed === true || item.order_placed_raw === "1" || item.order_placed === "Y",
          no_order_reason: item.no_order_reason || null,
          remarks: item.remarks || "",
        }));
        setRecentVisits(mapped);
      } else {
        const list = await getVisitsByPartyCode(partyCode, 10);
        setRecentVisits(list);
      }
    }
  }, [partyCode, isOnline]);

  useEffect(() => {
    if (!partyCode) {
      setRecentVisits([]);
      return;
    }
    let cancelled = false;
    loadRecentVisits().then(() => {}).catch(() => {}).finally(() => {});
    return () => { cancelled = true; };
  }, [partyCode, loadRecentVisits]);

  useEffect(() => {
    if (showNoOrderModal) {
      setVisitSubmitError(null);
      setVisitSubmitSuccess(false);
    }
  }, [showNoOrderModal]);

  const handleApplyFilter = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const customer = data?.customer;
  const summary = data?.summary;
  const recentOrdersRaw = data?.recent_orders || [];

  const customerInfo = customer
    ? {
        name: customer.CUSTOMER_NAME || "—",
        address: formatCustomerAddress(customer),
        contact: customer.CONT_PERSON || "—",
        phone: customer.CONT_NUM || "—",
        status: customer.ACT_STATUS === "Y" ? "Active Account" : "Inactive",
      }
    : {
        name: "—",
        address: "—",
        contact: "—",
        phone: "—",
        status: "—",
      };

  const metrics = summary
    ? [
        {
          title: "Total Sales Amount",
          amount: formatAmount(summary.total_sales_amount),
          subtext: `${summary.total_orders ?? 0} orders`,
          trend: "neutral",
        },
        {
          title: "Payable Amount",
          amount: formatAmount(summary.payable_amount),
          subtext: "Company owes Customer",
          trend: "neutral",
        },
        {
          title: "Receivable Amount",
          amount: formatAmount(summary.receivable_amount),
          subtext: "Customer owes Company",
          trend: "neutral",
          hasLink: true,
        },
        {
          title: "Sales Return Amount",
          amount: formatAmount(summary.sales_return_amount),
          subtext: "Returns",
          trend: "neutral",
          hasLink: true,
        },
      ]
    : [];

  const recentOrders = recentOrdersRaw.map((o) => ({
    orderNum: o.BRV_NUM || "—",
    date: o.DATED || "—",
    amount: formatAmount(o.INVOICE_AMT ?? o.LC_AMT),
    status: o.STATUS || "—",
  }));

  const searchLower = searchItems.trim().toLowerCase();
  const filteredRecentOrders = searchLower
    ? recentOrders.filter(
        (o) =>
          (o.orderNum && o.orderNum.toLowerCase().includes(searchLower)) ||
          (o.date && o.date.toLowerCase().includes(searchLower)) ||
          (o.amount && o.amount.toLowerCase().includes(searchLower)) ||
          (o.status && o.status.toLowerCase().includes(searchLower)),
      )
    : recentOrders;

  const chartData = [
    { month: "JAN", value: 5, label: "5%" },
    { month: "FEB", value: 7, label: "7%" },
    { month: "MAR", value: 10, label: "10%" },
    { month: "APR", value: 12, label: "12%" },
    { month: "MAY", value: 18, label: "18%" },
    { month: "JUN", value: 18, label: "18%" },
    { month: "JUL", value: 20, label: "20%" },
    { month: "AUG", value: 23, label: "23%" },
    { month: "SEP", value: 25, label: "25%" },
    { month: "OCT", value: 28, label: "28%" },
    { month: "NOV", value: 30, label: "30%" },
    { month: "DEC", value: 32, label: "32%" },
  ];

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            No customer selected. Please choose a customer from the list.
          </div>
          <Link
            href="/new-order"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4"
          >
            Back to Customers List
          </Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12 text-gray-500">
            Loading dashboard...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-4">
            {error}
          </div>
          <Link
            href="/new-order"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Customers List
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showCachedBanner && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            Showing cached data — server unreachable. Connect to the internet to refresh.
          </div>
        )}
        {/* Back Link and Title */}
        <div className="mb-6">
          <Link
            href="/new-order"
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
            Back to Customers List
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customer Dashboard
          </h1>
        </div>

        {/* Search and Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
            {/* Item Search – filters recent orders list by order #, date or amount */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search items..."
                value={searchItems}
                onChange={(e) => setSearchItems(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Date Range Filter – sent to API as from_date, to_date (YYYY-MM-DD) */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={loading}
                className="w-full cursor-pointer sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>

          {/* New Order Button – clear old cart, set party_code so products/cart APIs create fresh draft */}
          <Link
            href={partyCode ? `/products?party_code=${encodeURIComponent(partyCode)}` : "/products"}
            className="w-full lg:w-auto"
            onClick={() => {
              if (partyCode) {
                clearCartTrnsId();
                setSaleOrderPartyCode(partyCode);
              }
            }}
          >
            <button className="w-full cursor-pointer h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Order
            </button>
          </Link>
          {/* No order – Add remarks */}
          <button
            type="button"
            onClick={() => {
              setVisitDate(new Date().toISOString().slice(0, 10));
              setNoOrderReason("");
              setVisitRemarks("");
              setVisitSubmitSuccess(false);
              setShowNoOrderModal(true);
            }}
            className="w-full lg:w-auto cursor-pointer h-11 flex items-center justify-center gap-2 border border-amber-500 text-amber-700 hover:bg-amber-50 font-medium px-6 rounded-lg transition-colors"
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
            No order – Add remarks
          </button>
        </div>

        {/* No order visit modal */}
        {showNoOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Record visit (no order)</h2>
              {visitSubmitSuccess ? (
                <div className="text-center py-4">
                  <p className="text-green-600 font-medium mb-4">Visit saved successfully.</p>
                  <button
                    type="button"
                    onClick={() => setShowNoOrderModal(false)}
                    className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Customer: <span className="font-medium text-gray-900">{customerInfo.name}</span>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visit date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason (no order)</label>
                      <select
                        value={noOrderReason}
                        onChange={(e) => setNoOrderReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value="">Select reason</option>
                        {NO_ORDER_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                      <textarea
                        value={visitRemarks}
                        onChange={(e) => setVisitRemarks(e.target.value)}
                        rows={3}
                        placeholder="e.g. Customer will order next week"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {visitSubmitError && (
                    <p className="text-sm text-red-600 mt-4">{visitSubmitError}</p>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowNoOrderModal(false)}
                      className="flex-1 cursor-pointer py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!noOrderReason || visitSubmitLoading}
                      onClick={async () => {
                        setVisitSubmitError(null);
                        setVisitSubmitLoading(true);
                        const visitPayload = {
                          party_code: partyCode || "",
                          customer_name: customerInfo.name,
                          visit_date: visitDate,
                          order_placed: false,
                          no_order_reason: noOrderReason,
                          remarks: visitRemarks.trim(),
                        };
                        try {
                          if (isOnline) {
                            await createSalesVisit({
                              customer_id: partyCode || "",
                              party_code: partyCode || "",
                              visit_date: visitDate,
                              order_placed: "N",
                              order_trns_id: null,
                              no_order_reason: noOrderReason,
                              remarks: visitRemarks.trim() || undefined,
                            });
                          }
                          await saveVisit(visitPayload);
                          if (isOnline) {
                            await loadRecentVisits();
                          } else {
                            setRecentVisits((prev) => [
                              {
                                id: "v_" + Date.now(),
                                party_code: partyCode || "",
                                customer_name: customerInfo.name,
                                visit_date: visitDate,
                                order_placed: false,
                                no_order_reason: noOrderReason,
                                remarks: visitRemarks.trim(),
                              },
                              ...prev.slice(0, 9),
                            ]);
                          }
                          setVisitSubmitSuccess(true);
                        } catch (err) {
                          console.error(err);
                          const msg = err instanceof Error ? err.message : "Failed to save visit.";
                          setVisitSubmitError(msg);
                          if (!isOnline) {
                            await saveVisit(visitPayload).catch(() => {});
                            setRecentVisits((prev) => [
                              {
                                id: "v_" + Date.now(),
                                party_code: partyCode || "",
                                customer_name: customerInfo.name,
                                visit_date: visitDate,
                                order_placed: false,
                                no_order_reason: noOrderReason,
                                remarks: visitRemarks.trim(),
                              },
                              ...prev.slice(0, 9),
                            ]);
                            setVisitSubmitSuccess(true);
                          }
                        } finally {
                          setVisitSubmitLoading(false);
                        }
                      }}
                      className="flex-1 cursor-pointer py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
                    >
                      {visitSubmitLoading ? "Saving..." : "Save visit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Customer Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              {/* Profile Avatar with Initials - Centered on mobile/tablet */}
              <div className="flex justify-center md:justify-start w-full md:w-auto">
                <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {customerInfo.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {customerInfo.name}
                </h1>
                <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Retail Store</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                    {customerInfo.address && customerInfo.address !== "—" ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerInfo.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        title="Open in Google Maps"
                      >
                        {customerInfo.address}
                      </a>
                    ) : (
                      <span>{customerInfo.address}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Contact: {customerInfo.contact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{customerInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <span className="block md:inline-block w-full md:w-auto text-center bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {customerInfo.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm text-gray-500 font-medium">
                  {metric.title}
                </h3>
                {metric.hasLink && (
                  <Link
                    href={
                      metric.title === "Receivable Amount"
                        ? "/receivable-amount"
                        : metric.title === "Sales Return Amount"
                          ? `/sales-return-history?party_code=${encodeURIComponent(
                              partyCode || "",
                            )}`
                          : "#"
                    }
                    className="cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-blue-600 hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                )}
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  metric.trend === "overdue"
                    ? "text-red-500"
                    : "text-gray-900"
                }`}
              >
                {metric.amount}
              </div>
              <div
                className={`text-sm flex items-center gap-1 ${
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "overdue"
                      ? "text-red-500"
                      : "text-gray-500"
                }`}
              >
                {metric.trend === "up" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                )}
                <span>{metric.subtext}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart and Orders Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Sales Trend (12 Months)
            </h2>
            <div className="mb-4">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  MONTHLY SALES GROWTH TREND
                </h3>
                <p className="text-xs text-gray-500">Q1 - Q4 2024</p>
              </div>
            </div>
            <div className="relative h-64">
              {/* Chart */}
              <div className="flex items-end justify-between h-full border-b border-l border-gray-200 pb-8 pl-8">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1 h-full justify-end"
                  >
                    <span className="text-xs font-medium text-gray-900 mb-1">
                      {data.label}
                    </span>
                    <div
                      className="w-full mx-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${data.value * 3}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pb-8 pr-2">
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
                <span>$</span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Orders
              </h2>
              <Link
                href={partyCode ? `/existing-orders?party_code=${encodeURIComponent(partyCode)}${customerInfo.name && customerInfo.name !== "—" ? `&customer_name=${encodeURIComponent(customerInfo.name)}` : ""}` : "/existing-orders"}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <ReusableTable
              columns={[
                {
                  header: "Order #",
                  accessor: "orderNum",
                  width: "140px",
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
                  render: (row) => (
                    <span className="text-gray-600">{row.date}</span>
                  ),
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  width: "120px",
                  render: (row) => (
                    <span className="text-gray-900 font-semibold">
                      {row.amount}
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
                        row.status === "Completed"
                          ? "text-green-700 bg-green-50"
                          : "text-gray-500 bg-gray-100"
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
                  render: (row) => (
                    <Link href="/cart">
                      <button className="cursor-pointer flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Duplicate
                      </button>
                    </Link>
                  ),
                },
              ]}
              data={filteredRecentOrders}
              rowsPerPage={5}
            />
          </div>

          {/* Recent Visits */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Visits
              </h2>
              <Link
                href={partyCode ? `/visit-history?party_code=${encodeURIComponent(partyCode)}&customer_name=${encodeURIComponent(customerInfo.name || "")}` : "/visit-history"}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <ReusableTable
              columns={[
                {
                  header: "Date",
                  accessor: "visit_date",
                  width: "140px",
                  render: (row) => (
                    <span className="text-gray-600">
                      {row.visit_date
                        ? new Date(row.visit_date + "T12:00:00").toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  ),
                },
                {
                  header: "Order placed?",
                  accessor: "order_placed",
                  width: "120px",
                  render: (row) => (
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${
                        row.order_placed ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"
                      }`}
                    >
                      {row.order_placed ? "Yes" : "No"}
                    </span>
                  ),
                },
                {
                  header: "Reason",
                  accessor: "no_order_reason",
                  width: "160px",
                  render: (row) => (
                    <span className="text-gray-600">
                      {row.order_placed ? "—" : getReasonLabel(row.no_order_reason) || "—"}
                    </span>
                  ),
                },
                {
                  header: "Remarks",
                  accessor: "remarks",
                  render: (row) => (
                    <span className="text-gray-600 max-w-xs truncate block" title={row.remarks || ""}>
                      {row.order_placed ? "—" : (row.remarks || "—")}
                    </span>
                  ),
                },
              ]}
              data={recentVisits}
              rowsPerPage={5}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboardClient;


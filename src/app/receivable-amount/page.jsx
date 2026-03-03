"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import Dropdown from "../../components/common/Dropdown";
import { getPartySaleInvDashboard } from "@/services/shetApi";

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

function normalizeApiDate(val) {
  if (!val) return "";
  const raw = String(val).trim();
  if (!raw) return "";
  // already ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // dd-mm-yyyy or dd/mm/yyyy
  const m1 = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm}-${dd}`;
  }
  // dd-MMM-yy or dd-MMM-yyyy (e.g. 15-DEC-25 or 15-DEC-2025)
  const m2 = raw.match(/^(\d{2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (m2) {
    const [, dd, mon, yearRaw] = m2;
    const monthMap = {
      JAN: "01",
      FEB: "02",
      MAR: "03",
      APR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AUG: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DEC: "12",
    };
    const mm = monthMap[mon.toUpperCase()] || "01";
    const yyyy =
      yearRaw.length === 2
        ? `20${yearRaw}`
        : yearRaw;
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

function formatDisplayDate(val) {
  if (!val) return "—";
  const raw = String(val).trim();
  if (!raw) return "—";
  const isoDate = normalizeApiDate(raw);
  const d = isoDate ? new Date(`${isoDate}T12:00:00`) : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReceivableAmount() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get("party_code");

  const [statusFilter, setStatusFilter] = useState("open-partial");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("open-partial");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!partyCode);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: "open-partial", label: "Open & Partial" },
    { value: "open", label: "Open" },
    { value: "partially-paid", label: "Partially Paid" },
    { value: "closed", label: "Closed" },
    { value: "all", label: "All" },
  ];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!partyCode) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await getPartySaleInvDashboard(partyCode, {});
        if (!res?.success || !res?.data) {
          setError(res?.message || "Failed to load receivable details.");
          setData(null);
          return;
        }
        if (!cancelled) {
          setData(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load receivable details.",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [partyCode]);

  const customer = data?.customer;
  const summary = data?.summary;

  const customerInfo = useMemo(() => {
    if (!customer) {
      return {
        name: partyCode || "Customer",
        initials: (partyCode || "C").slice(0, 2).toUpperCase(),
        customerId: partyCode || "—",
        location: "—",
        phone: "—",
        totalReceivable: summary ? formatAmount(summary.receivable_amount) : "—",
      };
    }
    const name =
      customer.CUSTOMER_NAME ||
      customer.PARTY_NAME ||
      customer.SHORT_CODE ||
      partyCode ||
      "Customer";
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const id =
      customer.SHORT_CODE || customer.CUSTOMER_ID || customer.PARTY_CODE || "—";
    const phone = customer.CONT_NUM || customer.MOBILE || "—";
    return {
      name,
      initials,
      customerId: id,
      location: formatCustomerAddress(customer),
      phone,
      totalReceivable: summary ? formatAmount(summary.receivable_amount) : "—",
    };
  }, [customer, summary, partyCode]);

  const rawInvoices =
    data?.pending_invoices ||
    data?.receivable_invoices ||
    data?.invoices ||
    data?.recent_orders ||
    [];

  const mappedInvoices = useMemo(
    () =>
      (rawInvoices || []).map((inv, index) => {
        const invoiceNo =
          inv.INV_NUM ||
          inv.INVOICE_NO ||
          inv.invoice_no ||
          inv.BRV_NUM ||
          inv.DOC_NUM ||
          `INV-${index + 1}`;
        const invoiceDateRaw =
          inv.INVOICE_DATE ||
          inv.INV_DATE ||
          inv.invoice_date ||
          inv.DATED ||
          inv.date;
        const dueDateRaw =
          inv.DUE_DATE ||
          inv.due_date ||
          inv.DueDate ||
          inv.due ||
          null;
        const daysOverdue =
          inv.DAYS_OVERDUE ||
          inv.days_overdue ||
          inv.OVERDUE_DAYS ||
          inv.overdue_days ||
          "";
        const invoiceAmountRaw =
          inv.INVOICE_AMT ||
          inv.INV_AMT ||
          inv.invoice_amount ||
          inv.LC_AMT ||
          inv.amount ||
          0;

        const hasPendingField = Object.prototype.hasOwnProperty.call(
          inv,
          "RM_AMT",
        );

        const pendingRaw = hasPendingField ? inv.RM_AMT : null;

        const receivedRaw = hasPendingField
          ? Number(invoiceAmountRaw || 0) - Number(pendingRaw || 0)
          : inv.RECEIVED_AMOUNT ||
            inv.received_amount ||
            inv.REC_AMT ||
            inv.paid_amount ||
            0;

        const balanceRaw = hasPendingField
          ? pendingRaw
          : inv.BALANCE_AMOUNT ||
            inv.balance_amount ||
            inv.BAL_AMT ||
            inv.balance ||
            Number(invoiceAmountRaw || 0) - Number(receivedRaw || 0);

        const balNum = Number(balanceRaw || 0);
        const invNum = Number(invoiceAmountRaw || 0);

        let status =
          inv.STATUS ||
          inv.status ||
          (balNum <= 0
            ? "Closed"
            : balNum < invNum
            ? "Partially Paid"
            : "Open");

        const invoiceDateISO =
          typeof invoiceDateRaw === "string"
            ? normalizeApiDate(invoiceDateRaw)
            : "";

        return {
          key: invoiceNo + "_" + index,
          invoiceNo,
          invoiceDate: formatDisplayDate(invoiceDateRaw),
          invoiceDateISO,
          dueDate: formatDisplayDate(dueDateRaw),
          daysOverdue: daysOverdue || "—",
          invoiceAmount: formatAmount(invoiceAmountRaw),
          received: formatAmount(receivedRaw),
          balance: formatAmount(balanceRaw),
          balanceNumeric: balNum || 0,
          status,
        };
      }),
    [rawInvoices],
  );

  const filteredInvoices = useMemo(() => {
    let rows = mappedInvoices;

    if (appliedFrom) {
      rows = rows.filter(
        (r) =>
          !r.invoiceDateISO || r.invoiceDateISO >= appliedFrom,
      );
    }
    if (appliedTo) {
      rows = rows.filter(
        (r) =>
          !r.invoiceDateISO || r.invoiceDateISO <= appliedTo,
      );
    }

    if (appliedStatus === "open-partial") {
      rows = rows.filter((r) => r.balanceNumeric > 0);
    } else if (appliedStatus === "open") {
      rows = rows.filter(
        (r) =>
          r.balanceNumeric > 0 &&
          r.status.toLowerCase().includes("open"),
      );
    } else if (appliedStatus === "partially-paid") {
      rows = rows.filter((r) =>
        r.status.toLowerCase().includes("partial"),
      );
    } else if (appliedStatus === "closed") {
      rows = rows.filter((r) => r.balanceNumeric <= 0);
    }

    return rows;
  }, [mappedInvoices, appliedFrom, appliedTo, appliedStatus]);

  const totals = useMemo(() => {
    if (!filteredInvoices.length) {
      return {
        totalInvoiced: "—",
        totalReceived: "—",
        outstandingBalance: "—",
      };
    }
    let totalInv = 0;
    let totalRec = 0;
    let totalBal = 0;
    filteredInvoices.forEach((r) => {
      const invNum = Number(
        String(r.invoiceAmount).replace(/[^0-9.-]/g, ""),
      );
      const recNum = Number(
        String(r.received).replace(/[^0-9.-]/g, ""),
      );
      const balNum = Number(
        String(r.balance).replace(/[^0-9.-]/g, ""),
      );
      if (!Number.isNaN(invNum)) totalInv += invNum;
      if (!Number.isNaN(recNum)) totalRec += recNum;
      if (!Number.isNaN(balNum)) totalBal += balNum;
    });
    return {
      totalInvoiced: formatAmount(totalInv),
      totalReceived: formatAmount(totalRec),
      outstandingBalance: formatAmount(totalBal),
    };
  }, [filteredInvoices]);

  const handleApplyFilters = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setAppliedStatus(statusFilter);
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("open-partial");
    setAppliedFrom("");
    setAppliedTo("");
    setAppliedStatus("open-partial");
  };

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            No customer selected. Open this screen from Customer Dashboard.
          </div>
          <Link
            href="/customer-dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4"
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
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-12 text-gray-500">
            Loading receivable breakdown...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-4">
            {error}
          </div>
          <Link
            href={`/customer-dashboard?party_code=${encodeURIComponent(
              partyCode,
            )}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Dashboard
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
            href={`/customer-dashboard?party_code=${encodeURIComponent(
              partyCode,
            )}`}
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
            Receivable Breakdown
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Invoice and date-wise details for this customer
          </p>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
              {/* Profile Avatar - Centered on mobile */}
              <div className="flex justify-center sm:justify-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-2xl font-bold text-blue-600">
                    {customerInfo.initials}
                  </span>
                </div>
              </div>
              {/* Name and Details - Left aligned */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {customerInfo.name}
                </h2>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
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
                    <span className="truncate">{customerInfo.location}</span>
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{customerInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Total Receivable
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {customerInfo.totalReceivable}
              </p>
            </div>
          </div>
        </div>

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
            <div className="w-full sm:w-44">
              <Dropdown
                label="Status"
                name="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetFilters}
                className="cursor-pointer h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="cursor-pointer h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <ReusableTable
          columns={[
            {
              header: "Invoice No.",
              accessor: "invoiceNo",
              width: "150px",
              render: (row) => (
                <span className="text-gray-900 font-medium">
                  {row.invoiceNo}
                </span>
              ),
            },
            {
              header: "Invoice Date",
              accessor: "invoiceDate",
              width: "130px",
              render: (row) => (
                <span className="text-gray-600">{row.invoiceDate}</span>
              ),
            },
            {
              header: "Due Date",
              accessor: "dueDate",
              width: "130px",
              render: (row) => (
                <span className="text-gray-600">{row.dueDate}</span>
              ),
            },
            {
              header: "Days Overdue",
              accessor: "daysOverdue",
              width: "120px",
              render: (row) => (
                <span className="text-gray-900">{row.daysOverdue}</span>
              ),
            },
            {
              header: "Invoice Amount",
              accessor: "invoiceAmount",
              width: "140px",
              render: (row) => (
                <span className="text-gray-900 font-semibold block">
                  {row.invoiceAmount}
                </span>
              ),
            },
            {
              header: "Received",
              accessor: "received",
              width: "120px",
              render: (row) => (
                <span className="text-gray-900 font-semibold block">
                  {row.received}
                </span>
              ),
            },
            {
              header: "Balance",
              accessor: "balance",
              width: "120px",
              render: (row) => (
                <span className="text-gray-900 font-semibold block">
                  {row.balance}
                </span>
              ),
            },
            {
              header: "Status",
              accessor: "status",
              width: "140px",
              render: (row) => (
                <span
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${
                    row.status === "Closed"
                      ? "text-green-700 bg-green-50"
                      : row.status === "Partially Paid"
                      ? "text-yellow-700 bg-yellow-50"
                      : "text-red-700 bg-red-50"
                  }`}
                >
                  {row.status}
                </span>
              ),
            },
          ]}
          data={filteredInvoices}
          rowsPerPage={10}
        />

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span className="text-sm sm:text-base text-gray-600 font-medium">
              Summary for selected period
            </span>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 text-sm">
              <span className="text-gray-700">
                Total Invoiced:{" "}
                <strong className="font-semibold">
                  {totals.totalInvoiced}
                </strong>
              </span>
              <span className="text-gray-700">
                Total Received:{" "}
                <strong className="font-semibold">
                  {totals.totalReceived}
                </strong>
              </span>
              <span className="text-gray-700">
                Outstanding Balance:{" "}
                <strong className="font-semibold">
                  {totals.outstandingBalance}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

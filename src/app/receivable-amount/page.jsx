"use client";
import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import Dropdown from "../../components/common/Dropdown";

export default function ReceivableAmount() {
  const [statusFilter, setStatusFilter] = useState("open-partial");

  const statusOptions = [
    { value: "open-partial", label: "Open & Partial" },
    { value: "open", label: "Open" },
    { value: "partially-paid", label: "Partially Paid" },
    { value: "closed", label: "Closed" },
    { value: "all", label: "All" },
  ];

  const customerInfo = {
    name: "Alpha Supermarket",
    initials: "AS",
    customerId: "CUST-001",
    location: "Downtown, Metro City",
    phone: "+1 234 567 890",
    totalReceivable: "$3,450.00",
  };

  const invoices = [
    {
      invoiceNo: "INV-2023-145",
      invoiceDate: "Oct 10, 2023",
      dueDate: "Oct 25, 2023",
      daysOverdue: 5,
      invoiceAmount: "$1,800.00",
      received: "$1,000.00",
      balance: "$800.00",
      status: "Partially Paid",
    },
    {
      invoiceNo: "INV-2023-132",
      invoiceDate: "Sep 28, 2023",
      dueDate: "Oct 15, 2023",
      daysOverdue: 15,
      invoiceAmount: "$1,250.00",
      received: "$0.00",
      balance: "$1,250.00",
      status: "Open",
    },
    {
      invoiceNo: "INV-2023-118",
      invoiceDate: "Sep 15, 2023",
      dueDate: "Sep 30, 2023",
      daysOverdue: 30,
      invoiceAmount: "$400.00",
      received: "$0.00",
      balance: "$400.00",
      status: "Open",
    },
    {
      invoiceNo: "INV-2023-101",
      invoiceDate: "Aug 30, 2023",
      dueDate: "Sep 15, 2023",
      daysOverdue: 45,
      invoiceAmount: "$500.00",
      received: "$500.00",
      balance: "$0.00",
      status: "Closed",
    },
  ];

  const summary = {
    totalInvoiced: "$3,950.00",
    totalReceived: "$1,500.00",
    outstandingBalance: "$2,450.00",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back Button and Title */}
        <div className="mb-6">
          <Link
            href="/customer-dashboard"
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
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Receivable</p>
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
                defaultValue="2023-10-01"
                className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-44"
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">
                To
              </label>
              <input
                type="date"
                defaultValue="2023-10-31"
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
              <button className="cursor-pointer h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none">
                Reset
              </button>
              <button className="cursor-pointer h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none">
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
                <span className="text-gray-900 font-medium">{row.invoiceNo}</span>
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
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${row.status === "Closed"
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
          data={invoices}
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
                  {summary.totalInvoiced}
                </strong>
              </span>
              <span className="text-gray-700">
                Total Received:{" "}
                <strong className="font-semibold">
                  {summary.totalReceived}
                </strong>
              </span>
              <span className="text-gray-700">
                Outstanding Balance:{" "}
                <strong className="font-semibold">
                  {summary.outstandingBalance}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

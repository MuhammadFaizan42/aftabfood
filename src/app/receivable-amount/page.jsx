"use client";
import React from "react";
import Link from "next/link";
import Header from "../../components/common/Header";

export default function ReceivableAmount() {
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

      <main className="max-w-7xl mx-auto px-6 py-8">
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
          <h1 className="text-3xl font-bold text-gray-900">
            Receivable Breakdown
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Invoice and date-wise details for this customer
          </p>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {customerInfo.initials}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {customerInfo.name}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">#</span>
                    <span>{customerInfo.customerId}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                    <span>{customerInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
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
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Receivable</p>
              <p className="text-3xl font-bold text-gray-900">
                {customerInfo.totalReceivable}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1.5 font-medium">
                From Date
              </label>
              <input
                type="date"
                defaultValue="2023-10-01"
                className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1.5 font-medium">
                To Date
              </label>
              <input
                type="date"
                defaultValue="2023-10-31"
                className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1.5 font-medium">
                Status
              </label>
              <select className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44 bg-white">
                <option>Open & Partial</option>
                <option>Open</option>
                <option>Partially Paid</option>
                <option>Closed</option>
                <option>All</option>
              </select>
            </div>
            <button className="h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Reset
            </button>
            <button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Apply
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                    Invoice No.
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                    Invoice Date
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                    Due Date
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                    Days Overdue
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">
                    Invoice Amount
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">
                    Received
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">
                    Balance
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                      {invoice.invoiceNo}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {invoice.invoiceDate}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {invoice.dueDate}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {invoice.daysOverdue}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold text-right">
                      {invoice.invoiceAmount}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold text-right">
                      {invoice.received}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold text-right">
                      {invoice.balance}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${invoice.status === "Closed"
                            ? "text-green-700 bg-green-50"
                            : invoice.status === "Partially Paid"
                              ? "text-yellow-700 bg-yellow-50"
                              : "text-red-700 bg-red-50"
                          }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="border-t-2 border-gray-300 bg-gray-50 px-4 py-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">
                Summary for selected period
              </span>
              <div className="flex gap-8">
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
        </div>
      </main>
    </div>
  );
}

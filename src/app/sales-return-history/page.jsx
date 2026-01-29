"use client";
import React from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";

export default function SalesReturnHistory() {
  const customerInfo = {
    name: "Alpha Supermarket",
    initials: "AS",
    customerId: "CUST-001",
    location: "Downtown, Metro City",
    phone: "+1 234 567 890",
    totalReturnedAmount: "$1,290.00",
  };

  const returns = [
    {
      returnNo: "RET-2023-089",
      date: "Oct 25, 2023",
      refInvoice: "INV-2023-145",
      reason: "Damaged Goods",
      amount: "$450.00",
    },
    {
      returnNo: "RET-2023-072",
      date: "Oct 12, 2023",
      refInvoice: "INV-2023-132",
      reason: "Expired",
      amount: "$300.00",
    },
    {
      returnNo: "RET-2023-065",
      date: "Oct 05, 2023",
      refInvoice: "INV-2023-118",
      reason: "Wrong Item",
      amount: "$150.00",
    },
    {
      returnNo: "RET-2023-050",
      date: "Sep 28, 2023",
      refInvoice: "INV-2023-101",
      reason: "Short Expiry",
      amount: "$390.00",
    },
  ];

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
                {customerInfo.totalReturnedAmount}
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

        {/* Returns Table */}
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
      </main>
    </div>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import Header from "../../components/common/Header";

export default function CustomerDashboard() {
  // Sample data
  const customerInfo = {
    name: "Super Mart & Co.",
    address: "123 Market Street, Downtown District",
    contact: "Mr. Ahmed Khan",
    phone: "+1 234 567 890",
    status: "Active Account",
  };

  const metrics = [
    {
      title: "Previous Orders Vol",
      amount: "$124,500",
      subtext: "+12% vs last year",
      trend: "up",
    },
    {
      title: "Payable Amount",
      amount: "$0.00",
      subtext: "Company owes Customer",
      trend: "neutral",
    },
    {
      title: "Receivable Amount",
      amount: "$4,250.00",
      subtext: "Overdue by 15 days",
      trend: "overdue",
      hasLink: true,
    },
    {
      title: "Sales Return Amount",
      amount: "$320.00",
      subtext: "Last 30 days",
      trend: "neutral",
      hasLink: true,
    },
  ];

  const recentOrders = [
    {
      orderNum: "#ORD-7782",
      date: "Oct 24, 2023",
      amount: "$1,250.00",
      status: "Completed",
    },
    {
      orderNum: "#ORD-7750",
      date: "Oct 10, 2023",
      amount: "$890.50",
      status: "Completed",
    },
    {
      orderNum: "#ORD-7712",
      date: "Sep 28, 2023",
      amount: "$2,100.00",
      status: "Completed",
    },
    {
      orderNum: "#ORD-7689",
      date: "Sep 15, 2023",
      amount: "$450.00",
      status: "Cancelled",
    },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
            {/* Item Search */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search items..."
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

            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">From</label>
                <input
                  type="date"
                  defaultValue="2026-01-20"
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">To</label>
                <input
                  type="date"
                  defaultValue="2026-01-27"
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <button className="w-full cursor-pointer sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                Apply Filter
              </button>
            </div>
          </div>

          {/* New Order Button */}
          <button className="w-full cursor-pointer lg:w-auto h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors">
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
        </div>

        {/* Customer Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {customerInfo.name}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
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
                  <span>{customerInfo.address}</span>
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
            <div>
              <span className="inline-block bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
                    href={metric.title === "Receivable Amount" ? "/receivable-amount" : "#"}
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
                className={`text-3xl font-bold mb-2 ${metric.trend === "overdue" ? "text-red-500" : "text-gray-900"
                  }`}
              >
                {metric.amount}
              </div>
              <div
                className={`text-sm flex items-center gap-1 ${metric.trend === "up"
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
              <button className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-3 whitespace-nowrap">
                      Order #
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-3 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-3 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-3 whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 px-3 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-900">
                        {order.orderNum}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-600">
                        {order.date}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {order.amount}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded ${order.status === "Completed"
                            ? "text-green-700 bg-green-50"
                            : "text-gray-500 bg-gray-100"
                            }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <button className="cursor-pointer flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import Header from "../../components/common/Header";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Order Card */}
          <Link href="/new-order">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-teal-500 p-8 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  New Order
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Create a new sales order for a customer from the catalog.
                </p>
              </div>
            </div>
          </Link>

          {/* Existing Orders Card */}
          <Link href="/existing-orders">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Existing Orders
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Review and correct previously collected orders, with date filters and totals.
                </p>
              </div>
            </div>
          </Link>

          {/* Logout Card */}
          <Link href="/">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Logout
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  End your current session and return to login screen.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

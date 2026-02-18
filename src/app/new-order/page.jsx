"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import CreateCustomer from "../../components/layouts/Modals/CreateCustomer";
import { getCustomers } from "@/services/shetApi";

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-yellow-100", text: "text-yellow-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
];

function getInitials(name) {
  if (!name || typeof name !== "string") return "??";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatLocation(c) {
  const parts = [c.ST, c.ADRES, c.DIVISION, c.PROVINCES, c.TEHSIL, c.AREA_DIS].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function NewOrder() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomers();
      if (!res?.success || !Array.isArray(res.data)) {
        setCustomers([]);
        return;
      }
      setCustomers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers
    .map((c, i) => ({
      ...c,
      name: c.CUSTOMER_NAME || "—",
      code: c.SHORT_CODE || c.CUSTOMER_ID || c.PK_ID || "—",
      location: formatLocation(c),
      initials: getInitials(c.CUSTOMER_NAME),
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    }))
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.code).toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
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
          <span className="font-medium">Back to Dashboard</span>
        </button>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Select Customer
            </h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create New Customer</span>
            </button>
          </div>
          <p className="text-gray-500">
            Choose a customer to start a new order
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
            <input
              type="text"
              placeholder="Search by Customer Name or Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Loading customers...
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Customer List */}
        {!loading && (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.PK_ID || customer.CUSTOMER_ID || customer.name}
                className="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 ${customer.avatarColor.bg} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}
                    >
                      {customer.EMP_PIC ? (
                        <img
                          src={customer.EMP_PIC}
                          alt={customer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className={`text-lg font-semibold ${customer.avatarColor.text}`}>
                          {customer.initials}
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="text-gray-500 font-medium">#{customer.code}</span>
                        {customer.location && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {customer.location}
                          </span>
                        )}
                        {(customer.CONT_PERSON || customer.contactPerson) && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Contact: {customer.CONT_PERSON || customer.contactPerson}
                          </span>
                        )}
                        {(customer.CONT_NUM || customer.contactNum) && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {customer.CONT_NUM || customer.contactNum}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Select Button – opens dashboard with this customer's party_code (SHORT_CODE) */}
                  <Link
                    href={`/customer-dashboard?party_code=${encodeURIComponent(customer.SHORT_CODE || customer.code)}`}
                    className="w-full sm:w-auto"
                  >
                    <button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors w-full">
                      Select
                    </button>
                  </Link>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && !error && (
              <div className="text-center py-12 text-gray-500">
                No customers found matching your search.
              </div>
            )}
          </div>
        )}
      </main>

      <CreateCustomer isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={loadCustomers} />
    </div>
  );
}

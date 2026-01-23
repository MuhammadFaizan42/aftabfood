"use client";
import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import CreateCustomer from "../../components/layouts/Modals/CreateCustomer";

export default function NewOrder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const customers = [
    {
      id: 1,
      name: "Alpha Supermarket",
      code: "CUST-001",
      location: "Downtown, Metro City",
      initials: "AS",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      id: 2,
      name: "Green Traders",
      code: "CUST-004",
      location: "Westside Market, Metro City",
      initials: "GT",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      id: 3,
      name: "Fresh Mart & Co.",
      code: "CUST-012",
      location: "Hilltop Area, North District",
      initials: "FM",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      id: 4,
      name: "Sunrise Bakery",
      code: "CUST-008",
      location: "Ocean View, Coastal Region",
      initials: "SB",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      id: 5,
      name: "Urban Corner Store",
      code: "CUST-023",
      location: "Central Plaza, Metro City",
      initials: "UC",
      bgColor: "bg-pink-100",
      textColor: "text-pink-600",
    },
  ];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
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

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 ${customer.bgColor} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}
                  >
                    {customer.code === "CUST-012" ? (
                      <img
                        src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100&h=100&fit=crop"
                        alt={customer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-lg font-semibold ${customer.textColor}`}>
                        {customer.initials}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      #{customer.code} · {customer.location}
                    </p>
                  </div>
                </div>

                {/* Select Button */}
                <Link href={`/order-details/${customer.id}`} className="w-full sm:w-auto">
                  <button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors w-full">
                    Select
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No customers found matching your search.
            </div>
          )}
        </div>
      </main>

      <CreateCustomer isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

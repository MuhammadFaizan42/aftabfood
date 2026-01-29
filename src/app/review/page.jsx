"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";

export default function OrderReview() {
  const router = useRouter();
  const [isDraftMode, setIsDraftMode] = useState(true);

  // Sample order data
  const customerInfo = {
    name: "Supermart & Co.",
    accountId: "CUST-88329",
    deliveryArea: "Downtown West",
    paymentTerms: "Net 30 Days",
  };

  const orderItems = [
    {
      id: 1,
      name: "Premium Arabica Coffee",
      sku: "CF-001",
      weight: "500g",
      unitPrice: 12.50,
      quantity: 2,
      total: 25.00,
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Classic Salted Chips",
      sku: "SN-102",
      weight: "150g",
      unitPrice: 2.20,
      quantity: 10,
      total: 22.00,
      image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Dark Chocolate Bar",
      sku: "CH-550",
      weight: "100g",
      unitPrice: 3.50,
      quantity: 1,
      total: 3.50,
      image: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop",
    },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const discount = 0.00;
  const grandTotal = subtotal + tax - discount;

  const handleSubmitOrder = () => {
    router.push("/order-success");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Order Review
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Please verify all details before submitting
            </p>
          </div>
          <Link href='/cart'>
            <button
              className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-cyan-500 text-white hover:bg-cyan-600"
            >
              Draft Mode
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Customer Name
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {customerInfo.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Account ID
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {customerInfo.accountId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Delivery Area
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {customerInfo.deliveryArea}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Payment Terms
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {customerInfo.paymentTerms}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h2>
                <Link
                  href="/cart"
                  className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit Items
                </Link>
              </div>

              <ReusableTable
                columns={[
                  {
                    header: "Product",
                    accessor: "name",
                    width: "2fr",
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={row.image}
                            alt={row.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">SKU: {row.sku} • {row.weight}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: "Unit Price",
                    accessor: "unitPrice",
                    width: "1fr",
                    render: (row) => (
                      <span className="text-gray-700">${row.unitPrice.toFixed(2)}</span>
                    ),
                  },
                  {
                    header: "Qty",
                    accessor: "quantity",
                    width: "0.5fr",
                    render: (row) => (
                      <span className="text-gray-700">{row.quantity}</span>
                    ),
                  },
                  {
                    header: "Total",
                    accessor: "total",
                    width: "1fr",
                    render: (row) => (
                      <span className="font-semibold text-gray-900">${row.total.toFixed(2)}</span>
                    ),
                  },
                ]}
                data={orderItems}
                showPagination={false}
                rowsPerPage={100}
              />
            </div>
          </div>

          {/* Right Column - Final Totals */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Final Totals
              </h2>

              {/* Totals Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="text-gray-900 font-medium">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600 font-medium">
                    -${discount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      Grand Total
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
              >
                Submit Order
              </button>

              {/* Terms Agreement */}
              <p className="text-xs text-center text-gray-500">
                By submitting, you agree to the sales terms.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

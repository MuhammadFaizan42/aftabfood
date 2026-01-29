"use client";
import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import Image from "next/image";
import ReusableTable from "../../components/common/ReusableTable";

export default function Cart() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Premium Arabica Coffee",
      sku: "CF-001",
      weight: "500g",
      price: 12.50,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Classic Salted Chips",
      sku: "SN-102",
      weight: "150g",
      price: 2.20,
      quantity: 10,
      image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Dark Chocolate Bar",
      sku: "CH-550",
      weight: "100g",
      price: 3.50,
      quantity: 1,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4r_gUxL2fZje535dPxCOdw5eXmqQmjPJ8cw&s",
    },
  ]);

  const updateQuantity = (id, increment) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + increment;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    }));
  };

  const handleQuantityChange = (id, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      setCartItems(cartItems.map(item =>
        item.id === id ? { ...item, quantity: 1 } : item
      ));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === id ? { ...item, quantity: numValue } : item
      ));
    }
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const discount = 0.00;
  const grandTotal = subtotal + tax - discount;

  const columns = [
    {
      header: "Product",
      accessor: "product",
      width: "280px",
      minWidth: "280px",
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={row.image}
              alt={row.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23e5e7eb" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24"%3E📦%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">SKU: {row.sku} • {row.weight}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      width: "100px",
      minWidth: "100px",
      render: (row) => (
        <div className="font-medium text-gray-900">${row.price.toFixed(2)}</div>
      ),
    },
    {
      header: "Quantity",
      accessor: "quantity",
      width: "180px",
      minWidth: "180px",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(row.id, -1)}
            className="cursor-pointer w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min="1"
            value={row.quantity}
            onChange={(e) => handleQuantityChange(row.id, e.target.value)}
            className="w-20 h-8 text-center border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => updateQuantity(row.id, 1)}
            className="cursor-pointer w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total",
      width: "100px",
      minWidth: "100px",
      render: (row) => (
        <div className="font-semibold text-gray-900">${(row.price * row.quantity).toFixed(2)}</div>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      width: "80px",
      minWidth: "80px",
      render: (row) => (
        <button
          onClick={() => removeItem(row.id)}
          className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Link
          href="/products"
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
          Back to Products
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
          <span className="text-sm text-gray-500">Order #ORD-2023-884</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Section - Order Summary */}
          <div className="lg:col-span-2">
            <ReusableTable
              columns={columns}
              data={cartItems}
              showPagination={false}
            />
          </div>

          {/* Right Section - Payment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>

              {/* Payment breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({calculateTotalItems()} items)</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Continue Button */}
              <Link href='/review'>
                <button className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                  Continue to Review
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";

export default function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const orderId = searchParams.get("order_id") || `ORD-${Date.now()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-[550px] w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600 font-mono">Order #{orderId}</span>
            </div>
            <button
              onClick={handleCopy}
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-colors"
              title={copied ? "Copied!" : "Copy Order ID"}
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            The transaction has been verified and synced with the ERP system. A confirmation email has been sent.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

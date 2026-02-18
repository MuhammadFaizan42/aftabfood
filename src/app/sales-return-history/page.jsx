import React, { Suspense } from "react";
import SalesReturnHistoryClient from "./SalesReturnHistoryClient";

export default function SalesReturnHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading sales return history...
        </div>
      }
    >
      <SalesReturnHistoryClient />
    </Suspense>
  );
}

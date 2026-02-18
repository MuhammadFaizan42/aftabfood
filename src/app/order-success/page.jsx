import React, { Suspense } from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}

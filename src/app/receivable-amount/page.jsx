import React, { Suspense } from "react";
import ReceivableAmountClient from "./ReceivableAmountClient";

export const dynamic = "force-dynamic";

export default function ReceivableAmountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading receivable breakdown...
        </div>
      }
    >
      <ReceivableAmountClient />
    </Suspense>
  );
}

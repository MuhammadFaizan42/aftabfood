import React, { Suspense } from "react";
import TotalSalesInvoicesClient from "./TotalSalesInvoicesClient";

export const dynamic = "force-dynamic";

export default function TotalSalesInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading sales invoices...
        </div>
      }
    >
      <TotalSalesInvoicesClient />
    </Suspense>
  );
}

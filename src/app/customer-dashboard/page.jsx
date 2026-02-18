import React, { Suspense } from "react";
import CustomerDashboardClient from "./CustomerDashboardClient";

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading customer dashboard...
        </div>
      }
    >
      <CustomerDashboardClient />
    </Suspense>
  );
}

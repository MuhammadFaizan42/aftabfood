"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import { getSaleRoutes } from "@/services/shetApi";

function normalizeSaleRoutes(res) {
  const raw = res?.data?.data ?? res?.data ?? [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr.map((r, idx) => {
    const routeName = String(r?.route_name ?? r?.route ?? r?.name ?? `Route ${idx + 1}`).trim();
    const rawCustomers = Array.isArray(r?.customers) ? r.customers : [];
    const customers = rawCustomers
      .map((c, cIdx) => {
        const code = String(c?.short_code ?? c?.party_code ?? c?.customer_id ?? "").trim();
        const name = String(c?.customer_name ?? c?.name ?? "—").trim();
        const postalCode = String(c?.postal_code ?? c?.post_code ?? "").trim();
        return {
          id: code || `${idx}-${cIdx}`,
          code: code || "—",
          name: name || "—",
          postalCode,
        };
      })
      .filter((c) => c.code !== "—" || c.name !== "—");

    return {
      id: routeName ? `${routeName}__${idx}` : `route-${idx}`,
      name: routeName || "—",
      customers,
    };
  });
}

export default function SaleRoutePage() {
  const [openRouteIds, setOpenRouteIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);

  const showSoon = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const toggleRoute = useCallback((routeId) => {
    setOpenRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }, []);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSaleRoutes();
      if (res && typeof res === "object" && res.success === false) {
        throw new Error(res.message || "Could not load sale routes.");
      }
      const list = normalizeSaleRoutes(res);
      setRoutes(list);
      setOpenRouteIds(new Set());
    } catch (e) {
      setRoutes([]);
      setError(e instanceof Error ? e.message : "Could not load sale routes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes().catch(() => {});
  }, [loadRoutes]);

  const routeList = useMemo(() => routes, [routes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sale Route</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a route to view customers. WhatsApp actions will connect to the API in a later step.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadRoutes()}
              disabled={loading}
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Refresh routes"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.906-3.5M4 16a8 8 0 0014.906 3.5" />
              </svg>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <span className="text-xs text-gray-500">
              {loading ? "Loading from server..." : `${routeList.length} route(s)`}
            </span>
          </div>
        </div>

        {toast && (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
            role="status"
          >
            {toast}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && routeList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-gray-500">
            Loading sale routes...
          </div>
        ) : routeList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-gray-500">
            No sale routes found.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Sale routes list">
            {routeList.map((route) => {
              const open = openRouteIds.has(route.id);
              return (
                <li
                  key={route.id}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                    <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                      <span className="font-semibold text-gray-900 truncate">{route.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors"
                          title="Sale visit — WhatsApp (coming soon)"
                          aria-label={`Sale visit WhatsApp for ${route.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            showSoon("Sale visit (WhatsApp) — API not wired yet.");
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                          title="Order delivery notice — WhatsApp (coming soon)"
                          aria-label={`Order delivery notice for ${route.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            showSoon("Delivery notice (WhatsApp) — API not wired yet.");
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      aria-expanded={open}
                      aria-controls={`route-customers-${route.id}`}
                      title={open ? "Hide customers" : "Show customers"}
                      onClick={() => toggleRoute(route.id)}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {open && (
                    <div
                      id={`route-customers-${route.id}`}
                      className="border-t border-gray-100 bg-gray-50/80 px-3 sm:px-4 py-3"
                    >
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Customers on this route
                      </p>
                      {route.customers.length === 0 ? (
                        <p className="text-sm text-gray-500">No customers found.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden">
                          {route.customers.map((c) => (
                            <li
                              key={c.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                            >
                              <div className="min-w-0">
                                <span className="font-medium text-gray-900">{c.name}</span>
                                <span className="text-gray-500"> · {c.code}</span>
                                {c.postalCode ? (
                                  <span className="text-gray-400"> · {c.postalCode}</span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}


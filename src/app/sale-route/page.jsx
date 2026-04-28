"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import { getSaleRoutes } from "@/services/shetApi";

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-yellow-100", text: "text-yellow-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
];

function getInitials(name) {
  if (!name || typeof name !== "string") return "??";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatCustomerLocation(c) {
  const parts = [c.address, c.city, c.postalCode].filter((x) => String(x || "").trim());
  return parts.length ? parts.join(", ") : "—";
}

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
        const address = String(c?.address ?? c?.ADRES ?? c?.ADDRESS ?? "").trim();
        const city = String(c?.city ?? c?.CITY ?? "").trim();
        const phone = String(c?.phone ?? c?.CONT_NUM ?? c?.mobile ?? "").trim();
        return {
          id: code || `${idx}-${cIdx}`,
          code: code || "—",
          name: name || "—",
          postalCode,
          address,
          city,
          phone,
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
                        <div className="space-y-3">
                          {route.customers.map((c, i) => {
                            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            const loc = formatCustomerLocation(c);
                            const mapsQuery = loc !== "—" ? loc : [c.name, c.code].filter(Boolean).join(" ");
                            return (
                              <div
                                key={c.id}
                                className="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-center space-x-4 min-w-0">
                                    <div
                                      className={`w-11 h-11 ${color.bg} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}
                                    >
                                      <span className={`text-base font-semibold ${color.text}`}>
                                        {getInitials(c.name)}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                        {c.name}
                                      </h3>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                        <span className="text-gray-500 font-medium">#{c.code}</span>
                                        {loc && (
                                          <span className="flex items-center gap-1.5 min-w-0">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {loc !== "—" ? (
                                              <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-600 hover:text-blue-600 hover:underline cursor-pointer truncate"
                                                title="Open in Google Maps"
                                              >
                                                {loc}
                                              </a>
                                            ) : (
                                              <span className="truncate">{loc}</span>
                                            )}
                                          </span>
                                        )}
                                        {c.phone ? (
                                          <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {c.phone}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                  {c.code && c.code !== "—" ? (
                                    <Link
                                      href={`/customer-dashboard?party_code=${encodeURIComponent(c.code)}`}
                                      className="w-full sm:w-auto"
                                    >
                                      <button className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors w-full">
                                        Open
                                      </button>
                                    </Link>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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


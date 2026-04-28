"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import {
  getPartySaleInvDashboard,
  createSalesVisit,
  getSalesVisitHistory,
  getOrderReview,
  getInvoiceReview,
  getOrderSummary,
  getOrderSummaryInvoice,
  addToCart,
} from "@/services/shetApi";
import { setSaleOrderPartyCode, clearCartTrnsId, setCartTrnsId } from "@/lib/api";
import { getOrderLineItems } from "@/lib/orderLineItems";
import { enrichOrderLinesWithImages, DEFAULT_IMG, resolveProductImageUrl } from "@/lib/productImage";
import {
  cacheCustomerDashboard,
  getCachedCustomerDashboard,
  getCachedCustomers,
  cacheVisitHistory,
  getAllProductsSnapshot,
  getCachedVisitHistory,
  cacheOrderDetail,
  getCachedOrderDetail,
} from "@/lib/offline/bootstrapLoader";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { saveVisit, NO_ORDER_REASONS, getVisitsByPartyCode, getReasonLabel } from "@/lib/visits";

function formatCustomerAddress(c) {
  if (!c) return "—";
  const parts = [c.ST, c.ADRES, c.DIVISION, c.PROVINCES].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function formatAmount(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPrice(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return "£0.00";
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeExpiryToDmy(val) {
  if (val == null) return "";
  const raw = String(val).trim();
  if (!raw) return "";
  // Already in DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
  // Convert YYYY-MM-DD → DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  const m1 = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${dd}-${mm}-${yyyy}`;
  }
  const m2 = raw.match(/^(\d{2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (m2) {
    const [, dd, mon, yy] = m2;
    const monthMap = {
      JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
      JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const mm = monthMap[String(mon).toUpperCase()] || "01";
    const yyyy = String(yy).length === 2 ? `20${yy}` : String(yy);
    return `${dd}-${mm}-${yyyy}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  }
  return raw; // fallback: send original
}

/** Align with existing-orders: which statuses may open /cart for editing. */
function recentOrderCanEdit(statusDisplay, raw = {}) {
  const s = String(statusDisplay || "").trim().toLowerCase();
  return (
    s === "draft" ||
    s === "offline" ||
    s === "submitted" ||
    raw.can_edit === true ||
    raw.can_edit === "Y" ||
    raw.CAN_EDIT === "Y" ||
    raw.CAN_EDIT === true
  );
}

function CustomerDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyCode = searchParams.get("party_code");
  const isOnline = useOnlineStatus();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!partyCode);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [searchItems, setSearchItems] = useState("");
  const [showNoOrderModal, setShowNoOrderModal] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [noOrderReason, setNoOrderReason] = useState("");
  const [visitRemarks, setVisitRemarks] = useState("");
  const [visitSubmitLoading, setVisitSubmitLoading] = useState(false);
  const [visitSubmitSuccess, setVisitSubmitSuccess] = useState(false);
  const [visitSubmitError, setVisitSubmitError] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showCachedBanner, setShowCachedBanner] = useState(false);
  /** Short server/API error when we fall back to IDB cache while browser still reports online. */
  const [cachedBannerDetail, setCachedBannerDetail] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [viewLoading, setViewLoading] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const handleDuplicateOrder = React.useCallback(
    async (row) => {
      const orderId = row.id;
      const pc = row.partyCode ?? partyCode;
      if (!pc) {
        setDuplicateError("Customer not found for this order.");
        return;
      }
      if (orderId == null || orderId === "") {
        setDuplicateError("This order has no transaction ID to duplicate.");
        return;
      }
      if (String(orderId).startsWith("offline_")) {
        setDuplicateError("Duplicate when online. Opening order in cart.");
        setSaleOrderPartyCode(pc);
        setCartTrnsId(orderId);
        router.push("/cart");
        return;
      }
      setDuplicateLoading(String(orderId));
      setDuplicateError(null);
      try {
        let items = [];
        try {
          const res = await getOrderReview(orderId);
          items = getOrderLineItems(res);
        } catch {
          const res = await getOrderSummaryInvoice(orderId);
          items = getOrderLineItems(res);
        }
        if (!items.length) {
          setDuplicateError("No items found in this order.");
          setDuplicateLoading(null);
          return;
        }
        // Best-effort duplicate: skip missing/inactive items and continue.
        // Use cached product snapshot as a quick "is this SKU in our catalog?" check to avoid API errors.
        const products = await getAllProductsSnapshot().catch(() => []);
        const productKeys = new Set();
        for (const p of Array.isArray(products) ? products : []) {
          const raw = p && typeof p === "object" ? p : {};
          const keys = [
            raw.PRODUCT_ID,
            raw.product_id,
            raw.SKU,
            raw.sku,
            raw.CODE,
            raw.code,
            raw.ITEM_CODE,
            raw.item_code,
            raw.INV_ITEM_ID,
            raw.inv_item_id,
            raw.PK_INV_ID,
            raw.pk_inv_id,
            raw.PK_ID,
            raw.pk_id,
            raw.id,
          ]
            .filter((x) => x != null && x !== "")
            .map((x) => String(x).trim());
          for (const k of keys) productKeys.add(k);
        }

        let newTrnsId = null;
        let added = 0;
        const skipped = [];

        for (const it of items) {
          const itemKey = String(it.itemId ?? "").trim();
          const label = it.itemName ? `${it.itemName} (${itemKey || "—"})` : (itemKey || "—");
          if (itemKey && productKeys.size > 0 && !productKeys.has(itemKey)) {
            skipped.push({ itemId: itemKey, itemName: it.itemName || "" });
            continue;
          }
          try {
            const batchNo = String(it.batch_no ?? it.batch ?? "").trim();
            const expDate = normalizeExpiryToDmy(it.exp_date ?? it.expiry_date ?? "");
            const res = await addToCart(pc, itemKey || it.sku || "", it.qty, newTrnsId, {
              unit_price: it.unitPrice,
              ...(it.uom ? { uom: it.uom } : {}),
              ...(batchNo ? { batch_no: batchNo } : {}),
              ...(expDate ? { exp_date: expDate } : {}),
            });
            // API sometimes responds with { success:false, message: ... } without throwing
            if (res && typeof res === "object" && res.success === false) {
              skipped.push({ itemId: itemKey, itemName: it.itemName || "", reason: res.message || "API rejected" });
              continue;
            }
            newTrnsId = res?.data?.trns_id ?? res?.trns_id ?? newTrnsId;
            added += 1;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e || "");
            skipped.push({ itemId: itemKey, itemName: it.itemName || "", reason: msg || `Failed to add ${label}` });
            continue;
          }
        }

        if (!newTrnsId) {
          const skippedCount = skipped.length;
          setDuplicateError(
            skippedCount
              ? `No items could be duplicated. Skipped ${skippedCount} inactive/missing item(s).`
              : "No items could be duplicated (all add-to-cart requests failed).",
          );
          setDuplicateLoading(null);
          return;
        }

        setCartTrnsId(newTrnsId);
        setSaleOrderPartyCode(pc);
        const skipList = skipped
          .map((s) => {
            const id = String(s.itemId ?? "").trim();
            const name = String(s.itemName ?? "").trim();
            if (name && id) return `${name} (${id})`;
            return name || id || "—";
          })
          .filter(Boolean);
        const MAX_SHOW = 6;
        const shown = skipList.slice(0, MAX_SHOW);
        const more = skipList.length > MAX_SHOW ? skipList.length - MAX_SHOW : 0;
        const summaryMsg = skipped.length
          ? [
              `Duplicated ${added} item(s). Skipped ${skipped.length} inactive/missing item(s).`,
              `Skipped: ${shown.join(", ")}${more ? ` … +${more} more` : ""}`,
            ].join("\n")
          : `Duplicated ${added} item(s).`;
        try {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("aftab_cart_flash", summaryMsg);
          }
        } catch {
          /* ignore */
        }
        setDuplicateLoading(null);
        router.push("/cart");
      } catch (err) {
        setDuplicateError(
          err instanceof Error ? err.message : "Failed to duplicate order.",
        );
        setDuplicateLoading(null);
      }
    },
    [partyCode, router],
  );

  const handleEditOrder = React.useCallback(
    (row) => {
      const pc = row.partyCode ?? partyCode;
      if (!pc) {
        setDuplicateError("Customer not found for this order.");
        return;
      }
      if (row.id == null || row.id === "") {
        setDuplicateError("This order has no transaction ID to edit.");
        return;
      }
      setDuplicateError(null);
      setSaleOrderPartyCode(pc);
      const raw = row._raw ?? {};
      const trnsIdForNav =
        raw.backend_trns_id ??
        raw.BACKEND_TRNS_ID ??
        row.id;
      setCartTrnsId(trnsIdForNav);
      router.push("/cart");
    },
    [partyCode, router],
  );

  const handleViewOrder = React.useCallback(async (row) => {
    const orderId = row.id;
    const raw = row?._raw ?? {};
    const trnsIdForFetch =
      raw.backend_trns_id ??
      raw.BACKEND_TRNS_ID ??
      raw.trns_id ??
      raw.TRNS_ID ??
      orderId;
    if (trnsIdForFetch == null || trnsIdForFetch === "") {
      setViewError("This order has no transaction ID to view.");
      setViewOrder(null);
      return;
    }
    setViewLoading(String(trnsIdForFetch));
    setViewError(null);
    try {
      let items = [];
      let sourceRes = null;
      try {
        sourceRes = await getInvoiceReview(trnsIdForFetch);
        try {
          await cacheOrderDetail(String(trnsIdForFetch), sourceRes?.data ?? sourceRes);
        } catch {
          /* ignore */
        }
        items = getOrderLineItems(sourceRes);
      } catch {
        try {
          sourceRes = await getOrderSummary(trnsIdForFetch);
          try {
            await cacheOrderDetail(String(trnsIdForFetch), sourceRes?.data ?? sourceRes);
          } catch {
            /* ignore */
          }
          items = getOrderLineItems(sourceRes);
        } catch {
          const cached = await getCachedOrderDetail(String(trnsIdForFetch)).catch(() => null);
          if (cached) {
            sourceRes = { success: true, data: cached };
            items = getOrderLineItems(sourceRes);
          }
        }
      }
      const products = await getAllProductsSnapshot();
      try {
        // Always attempt hydration (cached + live API) so images can resolve even when IDB cache is empty
        // or `navigator.onLine` reports false positives on some devices.
        items = await enrichOrderLinesWithImages(items, products, { hydrateFromApi: true });
      } catch {
        /* keep raw line items */
      }
      if (!items.length) {
        setViewError("No item details found for this order.");
      }
      setViewOrder({
        orderId: row.orderNum,
        date: row.date,
        amount: row.amount,
        status: row.status,
        items,
      });
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Failed to load order details.");
      setViewOrder(null);
    } finally {
      setViewLoading(null);
    }
  }, []);

  const loadDashboard = React.useCallback(async () => {
    if (!partyCode) return;
    setError(null);
    const online = typeof navigator !== "undefined" && navigator.onLine;

    let cached = null;
    try {
      cached = await getCachedCustomerDashboard(partyCode);
    } catch {
      /* ignore */
    }

    /* Cache-first: show dashboard immediately when IDB has data (critical for offline / flaky "online"). */
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (!online) {
      setShowCachedBanner(false);
      setCachedBannerDetail(null);
      if (!cached) {
        let customerLabel = partyCode;
        try {
          const customers = await getCachedCustomers();
          const c = customers.find(
            (x) => String(x.SHORT_CODE ?? x.CUSTOMER_ID ?? x.PARTY_CODE ?? x.code ?? "").trim() === String(partyCode).trim()
          );
          if (c) customerLabel = c.CUSTOMER_NAME ?? c.PARTY_NAME ?? c.SHORT_CODE ?? partyCode;
        } catch {
          /* ignore */
        }
        setError(`No cached data for ${customerLabel}. Open this page once when online on this device to use offline.`);
        setData(null);
      }
      setLoading(false);
      return;
    }

    const params = {
      recent_limit: 10,
      ...(appliedFrom && { from_date: appliedFrom }),
      ...(appliedTo && { to_date: appliedTo }),
    };
    try {
      let res;
      try {
        res = await getPartySaleInvDashboard(partyCode, params);
      } catch (apiErr) {
        if (cached) {
          setData(cached);
          setShowCachedBanner(true);
          setCachedBannerDetail(
            apiErr instanceof Error ? apiErr.message : String(apiErr || "").slice(0, 160)
          );
        } else {
          setError(apiErr instanceof Error ? apiErr.message : "Could not reach server. Open this page once when online to cache for offline.");
          setData(null);
        }
        setLoading(false);
        return;
      }
      if (!res?.success || !res?.data) {
        if (cached) {
          setData(cached);
          setShowCachedBanner(true);
          setCachedBannerDetail(String(res?.message || "Unexpected response from server.").slice(0, 160));
        } else {
          setError(res?.message || "Failed to load dashboard.");
          setData(null);
        }
        setLoading(false);
        return;
      }
      setData(res.data);
      setShowCachedBanner(false);
      setCachedBannerDetail(null);
      try {
        await cacheCustomerDashboard(partyCode, res.data);
      } catch {
        /* ignore cache errors */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      if (cached) {
        setData(cached);
        setShowCachedBanner(true);
        setCachedBannerDetail(err instanceof Error ? err.message.slice(0, 160) : String(err || "").slice(0, 160));
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [partyCode, appliedFrom, appliedTo, isOnline]);

  useEffect(() => {
    if (!partyCode) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [partyCode, appliedFrom, appliedTo, loadDashboard]);

  const loadRecentVisits = React.useCallback(async () => {
    if (!partyCode) return;
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (online) {
      try {
        const res = await getSalesVisitHistory(partyCode, partyCode);
        try {
          await cacheVisitHistory(partyCode, res?.data ?? res);
        } catch { /* ignore */ }
        const items = res?.data?.items;
        if (Array.isArray(items)) {
          const sorted = [...items].sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
          const mapped = sorted.slice(0, 10).map((item) => ({
            id: item.visit_id || item.visit_date + "_" + (item.visit_id ?? ""),
            visit_date: item.visit_date || "",
            order_placed: item.order_placed === true || item.order_placed_raw === "1" || item.order_placed === "Y",
            no_order_reason: item.no_order_reason || null,
            remarks: item.remarks || "",
          }));
          setRecentVisits(mapped);
        } else {
          setRecentVisits([]);
        }
      } catch {
        const list = await getVisitsByPartyCode(partyCode, 10);
        setRecentVisits(list);
      }
    } else {
      const cached = await getCachedVisitHistory(partyCode);
      if (Array.isArray(cached) && cached.length > 0) {
        const sorted = [...cached].sort((a, b) => (b.visit_date || "").localeCompare(a.visit_date || ""));
        const mapped = sorted.slice(0, 10).map((item) => ({
          id: item.visit_id || item.visit_date + "_" + (item.visit_id ?? ""),
          visit_date: item.visit_date || "",
          order_placed: item.order_placed === true || item.order_placed_raw === "1" || item.order_placed === "Y",
          no_order_reason: item.no_order_reason || null,
          remarks: item.remarks || "",
        }));
        setRecentVisits(mapped);
      } else {
        const list = await getVisitsByPartyCode(partyCode, 10);
        setRecentVisits(list);
      }
    }
  }, [partyCode, isOnline]);

  useEffect(() => {
    if (!partyCode) {
      setRecentVisits([]);
      return;
    }
    let cancelled = false;
    loadRecentVisits().then(() => {}).catch(() => {}).finally(() => {});
    return () => { cancelled = true; };
  }, [partyCode, loadRecentVisits]);

  useEffect(() => {
    if (showNoOrderModal) {
      setVisitSubmitError(null);
      setVisitSubmitSuccess(false);
    }
  }, [showNoOrderModal]);

  const handleApplyFilter = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const customer = data?.customer;
  const summary = data?.summary;
  /**
   * Recent Orders card:
   * Some customers come back with `recent_invoices` instead of `recent_orders` (or `recent_orders` is empty).
   * Prefer `recent_orders` when present, else fall back to `recent_invoices`.
   */
  const recentOrdersRaw = Array.isArray(data?.recent_orders) && data.recent_orders.length
    ? data.recent_orders
    : (Array.isArray(data?.recent_invoices) ? data.recent_invoices : []);

  const customerInfo = customer
    ? {
        name: customer.CUSTOMER_NAME || "—",
        address: formatCustomerAddress(customer),
        contact: customer.CONT_PERSON || "—",
        phone: customer.CONT_NUM || "—",
        status: customer.ACT_STATUS === "Y" ? "Active Account" : "Inactive",
      }
    : {
        name: "—",
        address: "—",
        contact: "—",
        phone: "—",
        status: "—",
      };

  const metrics = summary
    ? [
        {
          title: "Total Sales Amount",
          amount: formatAmount(summary.total_sales_amount),
          subtext: `${summary.total_orders ?? 0} orders`,
          trend: "neutral",
          hasLink: true,
        },
        {
          title: "Payable Amount",
          amount: formatAmount(summary.payable_amount),
          subtext: "Company owes Customer",
          trend: "neutral",
        },
        {
          title: "Receivable Amount",
          amount: formatAmount(summary.receivable_amount),
          subtext: "Customer owes Company",
          trend: "neutral",
          hasLink: true,
        },
        {
          title: "Sales Return Amount",
          amount: formatAmount(summary.sales_return_amount),
          subtext: "Returns",
          trend: "neutral",
          hasLink: true,
        },
      ]
    : [];

  const recentOrders = recentOrdersRaw.map((o) => {
    const trns =
      o.backend_trns_id ??
      o.BACKEND_TRNS_ID ??
      o.ORDER_TRNS_ID ??
      o.order_trns_id ??
      o.SO_TRNS_ID ??
      o.so_trns_id ??
      o.TRNS_ID ??
      o.trns_id ??
      o.TRNSID ??
      o.transaction_id ??
      o.trns ??
      o.id ??
      null;
    const statusVal =
      o.STATUS_RAW ?? o.STATUS ?? o.status ?? o.order_status ?? "—";
    return {
      id:
        trns != null && trns !== ""
          ? String(trns)
          : null,
      partyCode:
        partyCode ??
        o.CUSTOMER_ID ??
        o.customer_id ??
        o.PARTY_CODE ??
        o.party_code ??
        null,
      orderNum:
        o.ORDER_NO ??
        o.BRV_NUM ??
        o.INVOICE_NO ??
        o.order_number ??
        o.order_id ??
        o.ORDER_ID ??
        "—",
      date:
        o.ORDER_DATE ??
        o.DATED ??
        o.INVOICE_DATE ??
        o.order_date ??
        o.date ??
        "—",
      amount: formatAmount(
        o.ORDER_AMOUNT ?? o.INVOICE_AMT ?? o.LC_AMT ?? o.amount,
      ),
      status: statusVal,
      canEdit: recentOrderCanEdit(statusVal, o),
      _raw: o,
    };
  });

  const searchLower = searchItems.trim().toLowerCase();
  const filteredRecentOrders = searchLower
    ? recentOrders.filter(
        (o) =>
          (o.orderNum && o.orderNum.toLowerCase().includes(searchLower)) ||
          (o.date && o.date.toLowerCase().includes(searchLower)) ||
          (o.amount && o.amount.toLowerCase().includes(searchLower)) ||
          (o.status && o.status.toLowerCase().includes(searchLower)),
      )
    : recentOrders;

  const salesTrendRaw = Array.isArray(data?.sales_trend) ? data.sales_trend : [];
  const salesTrendMap = new Map(
    salesTrendRaw
      .map((x) => {
        const key = String(x?.MONTH_KEY ?? x?.month_key ?? x?.MONTH ?? x?.month ?? "").trim();
        const amt = Number(x?.TOTAL_AMOUNT ?? x?.total_amount ?? x?.AMOUNT ?? x?.amount ?? 0) || 0;
        return [key, amt];
      })
      .filter(([k]) => /^\d{6}$/.test(String(k))),
  );
  const chartMonths = (() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const monthKey = `${yyyy}${mm}`;
      const monthLabel = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
      const amount = salesTrendMap.get(monthKey) ?? 0;
      months.push({ monthKey, month: monthLabel, amount });
    }
    return months;
  })();
  const maxAmount = Math.max(1, ...chartMonths.map((m) => Number(m.amount) || 0));
  const chartData = chartMonths.map((m) => ({
    month: m.month,
    value: Math.round(((Number(m.amount) || 0) / maxAmount) * 100),
    label: formatAmount(m.amount),
    rawAmount: m.amount,
  }));

  if (!partyCode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            No customer selected. Please choose a customer from the list.
          </div>
          <Link
            href="/new-order"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4"
          >
            Back to Customers List
          </Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12 text-gray-500">
            Loading dashboard...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-4">
            {error}
          </div>
          <Link
            href="/new-order"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Customers List
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showCachedBanner && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm flex items-center justify-between gap-3">
            <span className="min-w-0">
              {isOnline ? (
                <>
                  <span className="block font-medium text-amber-900">
                    Device is online, but the dashboard API did not respond.
                  </span>
                  <span className="block mt-1 text-amber-800/95">
                    Showing data saved on this device. Use Retry when the server is reachable again.
                  </span>
                  {cachedBannerDetail ? (
                    <span className="block mt-1.5 text-xs text-amber-700/90 break-words" title={cachedBannerDetail}>
                      {cachedBannerDetail}
                    </span>
                  ) : null}
                </>
              ) : (
                "Showing cached data — you are offline. Connect to the internet to refresh."
              )}
            </span>
            <button
              type="button"
              onClick={() => loadDashboard()}
              disabled={loading || !isOnline}
              className="shrink-0 cursor-pointer px-3 py-1.5 rounded-md border border-amber-300 bg-white text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}
        {/* Back Link and Title */}
        <div className="mb-6">
          <Link
            href="/new-order"
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
            Back to Customers List
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customer Dashboard
          </h1>
        </div>

        {/* Search and Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
            {/* Date Range Filter – sent to API as from_date, to_date (YYYY-MM-DD) */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1.5 font-medium">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full sm:w-44"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={loading}
                className="w-full cursor-pointer sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>

          {/* New Order Button – clear old cart, set party_code so products/cart APIs create fresh draft */}
          <Link
            href={partyCode ? `/products?party_code=${encodeURIComponent(partyCode)}` : "/products"}
            className="w-full lg:w-auto"
            onClick={() => {
              if (partyCode) {
                clearCartTrnsId();
                setSaleOrderPartyCode(partyCode);
              }
            }}
          >
            <button className="w-full cursor-pointer h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Order
            </button>
          </Link>
          {/* No order – Add remarks */}
          <button
            type="button"
            onClick={() => {
              setVisitDate(new Date().toISOString().slice(0, 10));
              setNoOrderReason("");
              setVisitRemarks("");
              setVisitSubmitSuccess(false);
              setShowNoOrderModal(true);
            }}
            className="w-full lg:w-auto cursor-pointer h-11 flex items-center justify-center gap-2 border border-amber-500 text-amber-700 hover:bg-amber-50 font-medium px-6 rounded-lg transition-colors"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            No order – Add remarks
          </button>
        </div>

        {/* No order visit modal */}
        {showNoOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Record visit (no order)</h2>
              {visitSubmitSuccess ? (
                <div className="text-center py-4">
                  <p className="text-green-600 font-medium mb-4">Visit saved successfully.</p>
                  <button
                    type="button"
                    onClick={() => setShowNoOrderModal(false)}
                    className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Customer: <span className="font-medium text-gray-900">{customerInfo.name}</span>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visit date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason (no order)</label>
                      <select
                        value={noOrderReason}
                        onChange={(e) => setNoOrderReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value="">Select reason</option>
                        {NO_ORDER_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                      <textarea
                        value={visitRemarks}
                        onChange={(e) => setVisitRemarks(e.target.value)}
                        rows={3}
                        placeholder="e.g. Customer will order next week"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {visitSubmitError && (
                    <p className="text-sm text-red-600 mt-4">{visitSubmitError}</p>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowNoOrderModal(false)}
                      className="flex-1 cursor-pointer py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!noOrderReason || visitSubmitLoading}
                      onClick={async () => {
                        setVisitSubmitError(null);
                        setVisitSubmitLoading(true);
                        const visitPayload = {
                          party_code: partyCode || "",
                          customer_name: customerInfo.name,
                          visit_date: visitDate,
                          order_placed: false,
                          no_order_reason: noOrderReason,
                          remarks: visitRemarks.trim(),
                        };
                        try {
                          if (isOnline) {
                            await createSalesVisit({
                              customer_id: partyCode || "",
                              party_code: partyCode || "",
                              visit_date: visitDate,
                              order_placed: "N",
                              order_trns_id: null,
                              no_order_reason: noOrderReason,
                              remarks: visitRemarks.trim() || undefined,
                            });
                          }
                          await saveVisit(visitPayload);
                          if (isOnline) {
                            await loadRecentVisits();
                          } else {
                            setRecentVisits((prev) => [
                              {
                                id: "v_" + Date.now(),
                                party_code: partyCode || "",
                                customer_name: customerInfo.name,
                                visit_date: visitDate,
                                order_placed: false,
                                no_order_reason: noOrderReason,
                                remarks: visitRemarks.trim(),
                              },
                              ...prev.slice(0, 9),
                            ]);
                          }
                          setVisitSubmitSuccess(true);
                        } catch (err) {
                          console.error(err);
                          const msg = err instanceof Error ? err.message : "Failed to save visit.";
                          setVisitSubmitError(msg);
                          if (!isOnline) {
                            await saveVisit(visitPayload).catch(() => {});
                            setRecentVisits((prev) => [
                              {
                                id: "v_" + Date.now(),
                                party_code: partyCode || "",
                                customer_name: customerInfo.name,
                                visit_date: visitDate,
                                order_placed: false,
                                no_order_reason: noOrderReason,
                                remarks: visitRemarks.trim(),
                              },
                              ...prev.slice(0, 9),
                            ]);
                            setVisitSubmitSuccess(true);
                          }
                        } finally {
                          setVisitSubmitLoading(false);
                        }
                      }}
                      className="flex-1 cursor-pointer py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
                    >
                      {visitSubmitLoading ? "Saving..." : "Save visit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Customer Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              {/* Profile Avatar with Initials - Centered on mobile/tablet */}
              <div className="flex justify-center md:justify-start w-full md:w-auto">
                <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {customerInfo.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {customerInfo.name}
                </h1>
                <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Retail Store</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {customerInfo.address && customerInfo.address !== "—" ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerInfo.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                        title="Open in Google Maps"
                      >
                        {customerInfo.address}
                      </a>
                    ) : (
                      <span>{customerInfo.address}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Contact: {customerInfo.contact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{customerInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <span className="block md:inline-block w-full md:w-auto text-center bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {customerInfo.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm text-gray-500 font-medium">
                  {metric.title}
                </h3>
                {metric.hasLink && (
                  <Link
                    href={
                      metric.title === "Total Sales Amount"
                        ? `/total-sales-invoices?party_code=${encodeURIComponent(
                            partyCode || "",
                          )}${
                            customerInfo.name && customerInfo.name !== "—"
                              ? `&customer_name=${encodeURIComponent(
                                  customerInfo.name,
                                )}`
                              : ""
                          }`
                        : metric.title === "Receivable Amount"
                        ? `/receivable-amount?party_code=${encodeURIComponent(
                            partyCode || "",
                          )}`
                        : metric.title === "Sales Return Amount"
                          ? `/sales-return-history?party_code=${encodeURIComponent(
                              partyCode || "",
                            )}`
                          : "#"
                    }
                    className="cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-blue-600 hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                )}
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  metric.trend === "overdue"
                    ? "text-red-500"
                    : "text-gray-900"
                }`}
              >
                {metric.amount}
              </div>
              <div
                className={`text-sm flex items-center gap-1 ${
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "overdue"
                      ? "text-red-500"
                      : "text-gray-500"
                }`}
              >
                {metric.trend === "up" && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                )}
                <span>{metric.subtext}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart and Orders Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Sales Trend (12 Months)
            </h2>
            <div className="mb-4">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  MONTHLY SALES GROWTH TREND
                </h3>
                <p className="text-xs text-gray-500">Last 12 months</p>
              </div>
            </div>
            <div className="relative h-64">
              {/* Chart */}
              <div className="flex items-end justify-between h-full border-b border-l border-gray-200 pb-8 pl-8">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1 h-full justify-end"
                  >
                    <span className="text-xs font-medium text-gray-900 mb-1">
                      {data.label}
                    </span>
                    <div
                      className="w-full mx-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${data.value * 3}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pb-8 pr-2">
                <span>£</span>
                <span>£</span>
                <span>£</span>
                <span>£</span>
                <span>£</span>
                <span>£</span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Invoices
              </h2>
              <Link
                href={partyCode ? `/existing-orders?party_code=${encodeURIComponent(partyCode)}${customerInfo.name && customerInfo.name !== "—" ? `&customer_name=${encodeURIComponent(customerInfo.name)}` : ""}` : "/existing-orders"}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Sale Order
              </Link>
            </div>
            {duplicateError && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm flex justify-between items-start gap-2">
                <span>{duplicateError}</span>
                <button
                  type="button"
                  onClick={() => setDuplicateError(null)}
                  className="text-amber-700 hover:text-amber-900 font-medium shrink-0"
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}
            <ReusableTable
              columns={[
                {
                  header: "Order #",
                  accessor: "orderNum",
                  width: "140px",
                  render: (row) => (
                    <span className="text-gray-900 font-medium">
                      {row.orderNum}
                    </span>
                  ),
                },
                {
                  header: "Date",
                  accessor: "date",
                  width: "140px",
                  render: (row) => (
                    <span className="text-gray-600">{row.date}</span>
                  ),
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  width: "120px",
                  render: (row) => (
                    <span className="text-gray-900 font-semibold">
                      {row.amount}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  width: "130px",
                  render: (row) => {
                    const s = String(row.status || "").trim();
                    const upper = s.toUpperCase();
                    const badgeClass =
                      upper === "COMPLETED" || upper === "SUBMITTED"
                        ? "text-green-700 bg-green-50"
                        : upper === "DRAFT"
                          ? "text-amber-700 bg-amber-50"
                          : /fast/i.test(s)
                            ? "text-blue-700 bg-blue-50"
                            : "text-gray-600 bg-gray-100";
                    return (
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${badgeClass}`}
                      >
                        {row.status}
                      </span>
                    );
                  },
                },
                {
                  header: "Action",
                  accessor: "action",
                  width: "300px",
                  minWidth: "280px",
                  render: (row) => {
                    const duplicateBusy =
                      duplicateLoading != null &&
                      String(duplicateLoading) === String(row.id);
                    const viewBusy =
                      viewLoading != null &&
                      String(viewLoading) === String(row.id);
                    const hasTrnsId = row.id != null && String(row.id).trim() !== "";
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={viewBusy}
                          onClick={() => handleViewOrder(row)}
                          className="cursor-pointer inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {viewBusy ? "…" : "View"}
                        </button>
                        {row.canEdit && (
                          <button
                            type="button"
                            disabled={!hasTrnsId}
                            onClick={() => handleEditOrder(row)}
                            title="Edit order in cart"
                            className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 border border-amber-300 rounded px-3 py-1.5 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!hasTrnsId || duplicateBusy}
                          onClick={() => handleDuplicateOrder(row)}
                          title={!hasTrnsId ? "Missing transaction id (cannot duplicate)" : "Duplicate"}
                          className="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          {duplicateBusy ? "…" : "Duplicate"}
                        </button>
                      </div>
                    );
                  },
                },
              ]}
              data={filteredRecentOrders}
              rowsPerPage={5}
            />
          </div>

          {/* Recent Visits */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Visits
              </h2>
              <Link
                href={partyCode ? `/visit-history?party_code=${encodeURIComponent(partyCode)}&customer_name=${encodeURIComponent(customerInfo.name || "")}` : "/visit-history"}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <ReusableTable
              columns={[
                {
                  header: "Date",
                  accessor: "visit_date",
                  width: "140px",
                  render: (row) => (
                    <span className="text-gray-600">
                      {row.visit_date
                        ? new Date(row.visit_date + "T12:00:00").toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  ),
                },
                {
                  header: "Order placed?",
                  accessor: "order_placed",
                  width: "120px",
                  render: (row) => (
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded ${
                        row.order_placed ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"
                      }`}
                    >
                      {row.order_placed ? "Yes" : "No"}
                    </span>
                  ),
                },
                {
                  header: "Reason",
                  accessor: "no_order_reason",
                  width: "160px",
                  render: (row) => (
                    <span className="text-gray-600">
                      {row.order_placed ? "—" : getReasonLabel(row.no_order_reason) || "—"}
                    </span>
                  ),
                },
                {
                  header: "Remarks",
                  accessor: "remarks",
                  render: (row) => (
                    <span className="text-gray-600 max-w-xs truncate block" title={row.remarks || ""}>
                      {row.order_placed ? "—" : (row.remarks || "—")}
                    </span>
                  ),
                },
              ]}
              data={recentVisits}
              rowsPerPage={5}
            />
          </div>
        </div>

        {/* Order View Modal */}
        {(viewOrder || viewError || viewLoading) && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            style={{ paddingTop: "100px" }}
            onMouseDown={(e) => {
              // backdrop click closes (only if click starts on backdrop)
              if (e.target === e.currentTarget) {
                setViewOrder(null);
                setViewError(null);
                setViewLoading(null);
              }
            }}
          >
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              style={{ maxHeight: "90vh", position: "relative" }}
            >
              {/* Hard close button: absolute so it cannot scroll out / be hidden */}
              <button
                type="button"
                onClick={() => {
                  setViewOrder(null);
                  setViewError(null);
                  setViewLoading(null);
                }}
                aria-label="Close view modal"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 50,
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid rgba(229, 231, 235, 1)",
                  background: "white",
                  color: "#111827",
                  fontSize: 26,
                  lineHeight: "38px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Details
                  </h3>
                  {viewOrder && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {viewOrder.orderId} · {viewOrder.date}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10" aria-hidden="true" />
              </div>

              <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 72px)" }}>
                {viewLoading ? (
                  <div className="text-sm text-gray-500">Loading order details...</div>
                ) : viewError ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm">
                    {viewError}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      <div className="lg:col-span-2 space-y-3">
                        {(viewOrder?.items || []).map((it, idx) => (
                          <div
                            key={`${it.itemId}-${idx}`}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={resolveProductImageUrl(it.image) || DEFAULT_IMG}
                                  alt={it.itemName || "Item"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = DEFAULT_IMG;
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {it.itemName || "—"}
                                </p>
                                <p className="text-sm text-gray-500 leading-tight">SKU: {it.sku || "—"}</p>
                                <p className="text-sm text-gray-400 leading-tight">Item ID: {it.itemId || "—"}</p>
                              </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-right min-w-[260px]">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Qty</p>
                                  <p className="text-sm font-medium text-gray-900">{it.qty ?? 0}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Rate</p>
                                  <p className="text-sm font-medium text-gray-900">{formatPrice(it.unitPrice)}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Total</p>
                                  <p className="text-sm font-semibold text-gray-900">{formatPrice(it.lineAmount)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!viewOrder?.items || viewOrder.items.length === 0) && (
                          <p className="text-sm text-gray-500">No items found.</p>
                        )}
                      </div>

                      <div className="lg:col-span-1">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-base font-semibold text-gray-900 mb-4">Payment Details</h4>
                          <div className="space-y-3 mb-5">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>Items</span>
                              <span className="font-semibold text-gray-900">
                                {(viewOrder?.items || []).reduce((acc, it) => acc + (Number(it.qty) || 0), 0)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>Subtotal</span>
                              <span className="font-semibold text-gray-900">
                                {formatPrice(
                                  (viewOrder?.items || []).reduce(
                                    (acc, it) => acc + (Number(it.lineAmount) || (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-900">Order Total</span>
                            <span className="text-lg font-bold text-gray-900">{viewOrder?.amount || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboardClient;


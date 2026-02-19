"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/common/Header";
import ReusableTable from "../../components/common/ReusableTable";
import { getOrderReview, submitOrder, getPartySaleInvDashboard } from "@/services/shetApi";
import { getCartTrnsId, clearCartTrnsId, getSaleOrderPartyCode } from "@/lib/api";

const DEFAULT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E";

function formatPrice(val) {
  if (val == null || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `£${n.toFixed(2)}`;
}

function mapReviewData(res) {
  if (!res?.success || !res?.data) return { customer: null, items: [], subtotal: 0, tax: 0, discount: 0, grandTotal: 0 };
  const d = res.data;
  const rawCustomer = d.customer ?? d.customer_info ?? d.party ?? {};
  const customer = {
    ...rawCustomer,
    CUSTOMER_NAME: rawCustomer.CUSTOMER_NAME ?? rawCustomer.customer_name ?? rawCustomer.name ?? d.party_name ?? d.customer_name ?? d.PARTY_NAME ?? d.CUSTOMER_NAME,
    SHORT_CODE: rawCustomer.SHORT_CODE ?? rawCustomer.party_code ?? rawCustomer.PARTY_CODE ?? rawCustomer.customer_id ?? rawCustomer.account_id ?? d.party_code ?? d.PARTY_CODE ?? d.customer_id ?? d.account_id,
    ADRES: rawCustomer.ADRES ?? rawCustomer.address ?? rawCustomer.ADDRESS ?? rawCustomer.delivery_address ?? d.address ?? d.ADRES ?? d.delivery_address ?? [rawCustomer.ST, rawCustomer.ADRES, rawCustomer.DIVISION, rawCustomer.PROVINCES].filter(Boolean).join(", "),
    pay_terms: rawCustomer.pay_terms ?? rawCustomer.PAY_TERMS ?? rawCustomer.payment_terms ?? d.pay_terms ?? d.PAY_TERMS ?? d.payment_terms,
  };
  const rawItems = d.items ?? d.lines ?? d.order_items ?? (Array.isArray(d) ? d : []);
  const items = (Array.isArray(rawItems) ? rawItems : []).map((r) => {
    const img = r.image ?? r.IMAGE_URL ?? r.image_url ?? "";
    return {
      id: r.item_id ?? r.product_id ?? r.id,
      name: r.product_name ?? r.PRODUCT_NAME ?? r.name ?? "—",
      sku: r.sku ?? r.PRODUCT_ID ?? "",
      unitPrice: Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? 0) || 0,
      quantity: Number(r.qty ?? r.quantity ?? 0) || 0,
      total: Number(r.line_total ?? r.total ?? 0) || 0,
      image: img || DEFAULT_IMG,
    };
  });
  const subtotal = Number(d.subtotal ?? d.sub_total ?? 0) || items.reduce((s, r) => s + r.total, 0);
  const tax = Number(d.tax ?? 0) || 0;
  const discount = Number(d.discount ?? 0) || 0;
  const grandTotal = Number(d.grand_total ?? d.total ?? 0) || subtotal + tax - discount;
  return { customer, items, subtotal, tax, discount, grandTotal };
}

export default function OrderReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isViewOnly = (searchParams?.get("mode") || "").toLowerCase() === "view";
  const [trnsId, setTrnsId] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [payTerms, setPayTerms] = useState("");
  const [discountVal, setDiscountVal] = useState("");
  const [remarks, setRemarks] = useState("");
  const [customerEnrich, setCustomerEnrich] = useState(null);

  const loadReview = useCallback(async () => {
    const id = getCartTrnsId();
    setTrnsId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setCustomerEnrich(null);
    try {
      const res = await getOrderReview(id);
      const { customer: c, items, subtotal: st, tax: t, discount: d, grandTotal: gt } = mapReviewData(res);
      setCustomer(c);
      setOrderItems(items);
      setSubtotal(st);
      setTax(t);
      setDiscount(d);
      setGrandTotal(gt);

      const partyCode = getSaleOrderPartyCode();
      if (partyCode) {
        try {
          const dash = await getPartySaleInvDashboard(partyCode);
          const cust = dash?.data?.customer;
          if (cust) {
            const deliveryArea = [cust.ST, cust.ADRES, cust.DIVISION, cust.PROVINCES].filter(Boolean).join(", ") || "—";
            const paymentTerms = cust.PAY_TERMS ?? cust.pay_terms ?? cust.PAYMENT_TERMS ?? "—";
            setCustomerEnrich({ deliveryArea, paymentTerms });
          }
        } catch {
          // ignore – order review already loaded
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order review.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const handleSubmitOrder = async () => {
    if (isViewOnly) return;
    if (!trnsId) return;
    setSubmitting(true);
    setError(null);
    try {
      const options = {};
      if (deliveryDate) options.delivery_date = deliveryDate;
      if (payTerms) options.pay_terms = payTerms;
      if (discountVal !== "" && !Number.isNaN(Number(discountVal))) options.discount = Number(discountVal);
      if (remarks) options.remarks = remarks;

      const res = await submitOrder(trnsId, options);
      clearCartTrnsId();
      const orderId = res?.data?.order_number ?? res?.data?.order_id ?? res?.data?.trns_id ?? trnsId;
      router.push(`/order-success?order_id=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit order.");
      setSubmitting(false);
    }
  };

  const storedPartyCode = typeof window !== "undefined" ? getSaleOrderPartyCode() : null;
  const baseInfo = customer
    ? {
        name: customer.CUSTOMER_NAME ?? customer.name ?? customer.customer_name ?? "—",
        accountId: customer.SHORT_CODE ?? customer.PARTY_CODE ?? customer.party_code ?? customer.customer_id ?? customer.account_id ?? storedPartyCode ?? "—",
        deliveryArea: customer.ADRES ?? customer.ADDRESS ?? customer.address ?? customer.delivery_address ?? ((typeof customer.ADRES === "string" ? customer.ADRES : [customer.ST, customer.ADRES, customer.DIVISION, customer.PROVINCES].filter(Boolean).join(", ")) || "—"),
        paymentTerms: customer.pay_terms ?? customer.PAY_TERMS ?? customer.payment_terms ?? "—",
      }
    : {
        name: "—",
        accountId: storedPartyCode ?? "—",
        deliveryArea: "—",
        paymentTerms: "—",
      };
  const customerInfo = customerEnrich
    ? {
        ...baseInfo,
        deliveryArea: baseInfo.deliveryArea && baseInfo.deliveryArea !== "—" ? baseInfo.deliveryArea : customerEnrich.deliveryArea,
        paymentTerms: baseInfo.paymentTerms && baseInfo.paymentTerms !== "—" ? baseInfo.paymentTerms : customerEnrich.paymentTerms,
      }
    : baseInfo;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-12 text-gray-500">Loading order review...</div>
        </main>
      </div>
    );
  }

  if (!trnsId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm mb-4">
            No order in progress. Add items from the product listing and go to Cart → Review.
          </div>
          <Link href="/products" className="text-blue-600 hover:text-blue-800">
            Go to Products
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isViewOnly ? "Order Detail" : "Order Review"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isViewOnly ? "Viewing an existing order" : "Verify details and submit"}
            </p>
          </div>
          {!isViewOnly && (
            <Link href="/cart">
              <button className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600">
                Edit Cart
              </button>
            </Link>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Name</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account ID</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.accountId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery / Address</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.deliveryArea}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Terms</p>
                  <p className="text-base font-semibold text-gray-900">{customerInfo.paymentTerms}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                {!isViewOnly && (
                  <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit Items
                  </Link>
                )}
              </div>
              <ReusableTable
                columns={[
                  {
                    header: "Product",
                    accessor: "name",
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        {row.image && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={row.image} alt="" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">SKU: {row.sku}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: "Unit Price",
                    accessor: "unitPrice",
                    render: (row) => <span className="text-gray-700">{formatPrice(row.unitPrice)}</span>,
                  },
                  {
                    header: "Qty",
                    accessor: "quantity",
                    render: (row) => <span className="text-gray-700">{row.quantity}</span>,
                  },
                  {
                    header: "Total",
                    accessor: "total",
                    render: (row) => <span className="font-semibold text-gray-900">{formatPrice(row.total)}</span>,
                  },
                ]}
                data={orderItems}
                showPagination={false}
                rowsPerPage={100}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Finalise Order</h2>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery Date (optional)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Terms (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Net 30"
                  value={payTerms}
                  onChange={(e) => setPayTerms(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Discount (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Remarks (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isViewOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none disabled:bg-gray-100"
                />
              </div>

              {(() => {
                const discountAmount = discountVal !== "" && !Number.isNaN(Number(discountVal)) ? Math.max(0, Number(discountVal)) : discount;
                const displayGrandTotal = subtotal + tax - discountAmount;
                return (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">-{formatPrice(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatPrice(displayGrandTotal)}</span>
                    </div>
                  </div>
                );
              })()}

              {!isViewOnly && (
                <>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit Order"}
                  </button>
                  <p className="text-xs text-center text-gray-500">
                    By submitting, you agree to the sales terms.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

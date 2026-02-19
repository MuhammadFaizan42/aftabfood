import { NextResponse } from "next/server";

const OTWOO_BASE = "https://api.otwoostores.com/restful";
const SALE_ORDER = `${OTWOO_BASE}/models/sale_order.php`;

/**
 * Batch sync offline orders
 * POST /api/sales/sync-orders
 * Body: { orders: [{ uuid, customer_id, items: [{ item_id, qty, unit_price, uom?, comments? }], delivery_date?, pay_terms?, discount?, remarks? }] }
 */
export async function POST(request) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ success: false, message: "Authorization required" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const orders = body.orders;
  if (!Array.isArray(orders) || orders.length === 0) {
    return NextResponse.json({ success: true, results: [] });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: auth,
  };

  const results = [];

  for (const order of orders) {
    const uuid = order.uuid;
    const customerId = order.customer_id;
    const items = order.items || [];
    const opts = {
      delivery_date: order.delivery_date,
      pay_terms: order.pay_terms,
      discount: order.discount,
      remarks: order.remarks,
    };

    if (!uuid || !customerId || items.length === 0) {
      results.push({ uuid, success: false, message: "Missing uuid, customer_id or items" });
      continue;
    }

    let trnsId = null;

    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const addBody = {
          customer_id: String(customerId),
          item_id: String(it.item_id ?? it.product_id ?? it.sku ?? ""),
          qty: Number(it.qty ?? 0) || 0,
          unit_price: Number(it.unit_price ?? 0) || 0,
          uom: it.uom || "",
          comments: it.comments || "",
        };
        if (trnsId != null) addBody.trns_id = trnsId;

        const addRes = await fetch(`${SALE_ORDER}?action=add_to_cart`, {
          method: "POST",
          headers,
          body: JSON.stringify(addBody),
        });
        const addData = await addRes.json().catch(() => ({}));
        if (!addRes.ok || !addData?.success) {
          throw new Error(addData?.message || "Add to cart failed");
        }
        trnsId = addData?.data?.trns_id ?? addData?.trns_id ?? trnsId;
      }

      const submitBody = {
        trns_id: trnsId,
        ...(opts.delivery_date && { delivery_date: opts.delivery_date }),
        ...(opts.pay_terms != null && opts.pay_terms !== "" && { pay_terms: opts.pay_terms }),
        ...(opts.discount != null && opts.discount !== "" && { discount: Number(opts.discount) }),
        ...(opts.remarks && { remarks: opts.remarks }),
      };

      const submitRes = await fetch(`${SALE_ORDER}?action=submit_order`, {
        method: "POST",
        headers,
        body: JSON.stringify(submitBody),
      });
      const submitData = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok || !submitData?.success) {
        throw new Error(submitData?.message || "Submit order failed");
      }

      const orderId =
        submitData?.data?.order_number ?? submitData?.data?.order_id ?? submitData?.data?.trns_id ?? trnsId;
      results.push({ uuid, success: true, order_id: orderId });
    } catch (err) {
      results.push({ uuid, success: false, message: err?.message || "Sync failed" });
    }
  }

  return NextResponse.json({ success: true, results });
}

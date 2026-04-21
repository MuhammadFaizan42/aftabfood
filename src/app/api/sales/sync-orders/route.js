import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

function itemKey(it) {
  return String(it.item_id ?? it.product_id ?? it.sku ?? "").trim();
}

/**
 * Batch sync offline orders with per-line stock handling.
 * POST /api/sales/sync-orders
 * Body: { orders: [{ uuid, customer_id, sync_draft_trns_id?, items: [...] }] }
 * Items may include _syncStatus: "synced" (already on server draft — skip add).
 */
export async function POST(request) {
  const saleOrderUrl = `${getApiBaseUrl()}/models/sale_order.php`;
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
      results.push({
        uuid,
        success: false,
        message: "Missing uuid, customer_id or items",
        line_results: [],
        submitted: false,
        partial: false,
      });
      continue;
    }

    let trnsId =
      order.sync_draft_trns_id != null && order.sync_draft_trns_id !== ""
        ? order.sync_draft_trns_id
        : null;

    const lineResults = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const ikey = itemKey(it);
        if (!ikey) {
          lineResults.push({ item_id: "", success: false, message: "Missing item id" });
          continue;
        }
        if (String(it._syncStatus ?? "").toLowerCase() === "synced") {
          lineResults.push({ item_id: ikey, skipped: true, already_synced: true });
          continue;
        }

        const addBody = {
          customer_id: String(customerId),
          item_id: ikey,
          qty: Number(it.qty ?? 0) || 0,
          unit_price: Number(it.unit_price ?? 0) || 0,
          uom: it.uom || "",
          comments: it.comments || "",
          batch_no: it.batch_no || "",
          exp_date: it.exp_date || it.expiry_date || "",
        };
        if (trnsId != null && trnsId !== "") addBody.trns_id = trnsId;

        const addRes = await fetch(`${saleOrderUrl}?action=add_to_cart`, {
          method: "POST",
          headers,
          body: JSON.stringify(addBody),
        });
        const addData = await addRes.json().catch(() => ({}));
        if (!addRes.ok || !addData?.success) {
          const msg =
            addData?.message ||
            addData?.error ||
            (typeof addData === "string" ? addData : null) ||
            "Add to cart failed";
          lineResults.push({ item_id: ikey, success: false, message: String(msg) });
          continue;
        }
        const nextTrns = addData?.data?.trns_id ?? addData?.trns_id ?? trnsId;
        if (nextTrns != null && nextTrns !== "") trnsId = nextTrns;
        lineResults.push({ item_id: ikey, success: true });
      }

      const stillPending = items.some((it) => {
        const k = itemKey(it);
        if (!k) return true;
        if (String(it._syncStatus ?? "").toLowerCase() === "synced") return false;
        return !lineResults.some((r) => r.item_id === k && r.success === true);
      });

      if (stillPending) {
        results.push({
          uuid,
          success: true,
          partial: true,
          draft_trns_id: trnsId ?? null,
          line_results: lineResults,
          submitted: false,
          message:
            "Some lines could not be added (e.g. insufficient stock). Retry when stock is available.",
        });
        continue;
      }

      if (trnsId == null || trnsId === "") {
        results.push({
          uuid,
          success: false,
          message: "No transaction id — no lines were added.",
          line_results: lineResults,
          submitted: false,
          partial: false,
        });
        continue;
      }

      const rms =
        opts.remarks != null && String(opts.remarks).trim() !== ""
          ? String(opts.remarks).trim().slice(0, 150)
          : null;
      const submitBody = {
        trns_id: trnsId,
        ...(opts.delivery_date && { delivery_date: opts.delivery_date }),
        ...(opts.pay_terms != null && opts.pay_terms !== "" && { pay_terms: opts.pay_terms }),
        ...(opts.discount != null && opts.discount !== "" && { discount: Number(opts.discount) }),
        ...(rms && { rms }),
      };

      const submitRes = await fetch(`${saleOrderUrl}?action=submit_order`, {
        method: "POST",
        headers,
        body: JSON.stringify(submitBody),
      });
      const submitData = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok || !submitData?.success) {
        const msg =
          submitData?.message ||
          submitData?.error ||
          (typeof submitData === "string" ? submitData : null) ||
          "Submit order failed";
        results.push({
          uuid,
          success: true,
          partial: true,
          submitted: false,
          message: String(msg),
          line_results: lineResults,
          draft_trns_id: trnsId,
          submit_failed: true,
        });
        continue;
      }

      const orderId =
        submitData?.data?.order_number ??
        submitData?.data?.order_id ??
        submitData?.data?.trns_id ??
        trnsId;
      results.push({
        uuid,
        success: true,
        partial: false,
        submitted: true,
        order_id: orderId,
        line_results: lineResults,
        draft_trns_id: null,
      });
    } catch (err) {
      results.push({
        uuid,
        success: false,
        message: err instanceof Error ? err.message : "Sync failed",
        line_results: lineResults,
        submitted: false,
        partial: !!trnsId,
        draft_trns_id: trnsId ?? null,
      });
    }
  }

  return NextResponse.json({ success: true, results });
}

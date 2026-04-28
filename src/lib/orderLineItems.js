import { pickImageFromOrderLine, resolveProductImageUrl } from "./productImage";

/** Extract line items { itemId, qty, unitPrice, ... } from order_review or order_summary response */
export function getOrderLineItems(res) {
  const d = res?.data?.data ?? res?.data ?? res;
  if (!d) return [];
  const rawItems =
    d.items ??
    d.lines ??
    d.cart ??
    d.order_items ??
    d.line_items ??
    d.data?.items ??
    d.data?.lines ??
    d.data?.cart ??
    d.data?.order_items ??
    d.data?.line_items ??
    (Array.isArray(d) ? d : []);
  const arr = Array.isArray(rawItems) ? rawItems : [];
  return arr
    .map((r) => {
      // Keep item id extraction aligned with cart/review mapping so cached image hydration can match reliably.
      const rawItemId =
        r.item_id ??
        r.product_id ??
        r.PRODUCT_ID ??
        r.ITEM_CODE ??
        r.CODE ??
        r.sku ??
        r.SKU ??
        r.PROD_ID ??
        r.product_code ??
        r.PART_NO ??
        r.PK_INV_ID ??
        r.id ??
        r.product?.id ??
        r.product?.product_id ??
        r.product?.code ??
        r.product?.PRODUCT_ID ??
        r.INV_ITEM_ID ??
        r.ITEM_ID ??
        r.PK_ID ??
        "";
      const itemId = String(rawItemId).trim();
      const itemName = String(
        r.item_name ??
          r.product_name ??
          r.ITEM_NAME ??
          r.PRODUCT_NAME ??
          r.name ??
          itemId ??
          "",
      ).trim();
      const rawImg = pickImageFromOrderLine(r);
      const image = rawImg ? resolveProductImageUrl(rawImg) : "";
      const sku = String(
        r.sku ??
          r.SKU ??
          r.PRODUCT_ID ??
          r.product_id ??
          r.ITEM_CODE ??
          r.CODE ??
          r.product_code ??
          r.PROD_ID ??
          r.PART_NO ??
          r.PK_INV_ID ??
          r.product?.PRODUCT_ID ??
          r.product?.product_id ??
          r.product?.code ??
          itemId ??
          "—",
      ).trim();
      const uom = String(
        r.uom ??
          r.UOM ??
          r.unit ??
          r.UNIT ??
          r.uom_name ??
          r.UOM_NAME ??
          r.unit_name ??
          r.UNIT_NAME ??
          "",
      ).trim();
      const batch = String(
        r.batch_no ??
          r.BATCH_NO ??
          r.batch ??
          r.BATCH ??
          r.batchNo ??
          "",
      ).trim();
      const expDate = String(
        r.exp_date ??
          r.EXP_DATE ??
          r.expiry_date ??
          r.EXPIRY_DATE ??
          r.exp_dt ??
          r.EXP_DT ??
          r.exp ??
          r.EXP ??
          "",
      ).trim();
      const qty = Number(r.qty ?? r.quantity ?? r.QTY ?? 0) || 0;
      const unitPrice = Number(r.unit_price ?? r.UNIT_PRICE ?? r.ITEM_RATE ?? r.price ?? 0) || 0;
      const lineAmount =
        Number(
          r.line_total ??
            r.LINE_TOTAL ??
            r.total ??
            r.LC_AMT ??
            r.amount ??
            qty * unitPrice,
        ) || 0;
      const _syncStatus = r._syncStatus;
      const _syncError = r._syncError;
      return {
        itemId,
        // Used by image/stock enrichers to match against product cache keys.
        itemIdForApi: itemId || null,
        itemName,
        sku,
        ...(uom ? { uom } : {}),
        ...(batch ? { batch, batch_no: batch } : {}),
        ...(expDate ? { exp_date: expDate } : {}),
        image,
        qty,
        unitPrice,
        lineAmount,
        ...(_syncStatus ? { _syncStatus } : {}),
        ...(_syncError ? { _syncError } : {}),
      };
    })
    .filter((it) => it.itemId && it.qty > 0);
}

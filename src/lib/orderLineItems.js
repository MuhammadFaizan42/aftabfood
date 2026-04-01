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
      const itemId = String(
        r.item_id ??
          r.product_id ??
          r.PRODUCT_ID ??
          r.ITEM_CODE ??
          r.CODE ??
          r.sku ??
          r.SKU ??
          r.INV_ITEM_ID ??
          r.ITEM_ID ??
          r.PK_ID ??
          r.id ??
          "",
      ).trim();
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
          itemId ??
          "—",
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
      return { itemId, itemName, sku, image, qty, unitPrice, lineAmount };
    })
    .filter((it) => it.itemId && it.qty > 0);
}

/**
 * Offline order queue – store pending orders in IndexedDB
 * Each order: { uuid, customer_id, items, delivery_date, pay_terms, discount, remarks, sync_status, createdAt }
 */
import { putOne, getAll, deleteByKey, getByKey } from "../idb";

const STORE = "orders";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Add a new offline order to the queue */
export async function enqueueOrder(order) {
  const uuid = order.uuid || generateUUID();
  const record = {
    uuid,
    customer_id: String(order.customer_id ?? ""),
    items: Array.isArray(order.items) ? order.items : [],
    delivery_date: order.delivery_date || "",
    pay_terms: order.pay_terms || "",
    discount: order.discount ?? 0,
    remarks: order.remarks || "",
    sync_status: "pending",
    createdAt: order.createdAt || new Date().toISOString(),
  };
  await putOne(STORE, record);
  return uuid;
}

/** Get all pending orders */
export async function getPendingOrders() {
  const all = await getAll(STORE);
  return all.filter((o) => o.sync_status === "pending");
}

/** Get all orders (pending + synced – for UI) */
export async function getAllOrders() {
  return getAll(STORE);
}

/** Get single order by uuid */
export async function getOrder(uuid) {
  return getByKey(STORE, uuid);
}

/** Remove order after successful sync */
export async function removeOrder(uuid) {
  return deleteByKey(STORE, uuid);
}

/** Mark order as synced (optional – or just remove) */
export async function markOrderSynced(uuid, serverOrderId) {
  const order = await getByKey(STORE, uuid);
  if (!order) return;
  const updated = { ...order, sync_status: "synced", server_order_id: serverOrderId };
  await putOne(STORE, updated);
}

/** Generate UUID for new offline orders */
export { generateUUID };

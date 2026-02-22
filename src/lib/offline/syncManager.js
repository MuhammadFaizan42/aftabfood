/**
 * Sync manager – when online: sync offline existing orders (one by one) and queue orders to backend.
 * Offline orders get backend_trns_id stored; queue orders are removed on success.
 */
import { getPendingOrders, removeOrder } from "./orderQueue";
import { getOfflineOrdersForSync, updateOfflineOrderWithBackendTrnsId } from "./bootstrapLoader";
import { getAuthToken } from "../api";

const SYNC_API = "/api/sales/sync-orders";

let syncInProgress = false;
let syncCallbacks = [];

export function onSyncComplete(callback) {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter((cb) => cb !== callback);
  };
}

function notifySyncComplete(result) {
  syncCallbacks.forEach((cb) => cb(result));
}

export async function syncPendingOrders() {
  if (syncInProgress) return { synced: 0, failed: 0 };
  syncInProgress = true;
  let synced = 0;
  let failed = 0;
  try {
    const offlineForSync = await getOfflineOrdersForSync();
    const queuePending = await getPendingOrders();
    const orders = [...offlineForSync, ...queuePending];
    if (orders.length === 0) {
      notifySyncComplete({ synced: 0, failed: 0 });
      return { synced: 0, failed: 0 };
    }

    const token = getAuthToken();
    const res = await fetch(SYNC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ orders }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failed = orders.length;
      notifySyncComplete({ synced: 0, failed, error: data?.message || res.statusText });
      return { synced: 0, failed };
    }

    const results = data.results || [];
    const offlinePrefix = "offline_";
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.success || !r.uuid) {
        failed++;
        continue;
      }
      const backendOrderId = r.order_id ?? r.order_number ?? r.trns_id;
      if (String(r.uuid).startsWith(offlinePrefix)) {
        await updateOfflineOrderWithBackendTrnsId(r.uuid, backendOrderId);
      } else {
        await removeOrder(r.uuid);
      }
      synced++;
    }
    notifySyncComplete({ synced, failed });
    return { synced, failed };
  } catch (err) {
    failed = (await getPendingOrders()).length + (await getOfflineOrdersForSync()).length;
    notifySyncComplete({ synced: 0, failed, error: err?.message });
    return { synced: 0, failed };
  } finally {
    syncInProgress = false;
  }
}

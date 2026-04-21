/**
 * Sync manager – when online: sync offline existing orders (one by one) and queue orders to backend.
 * Offline orders get backend_trns_id stored; queue orders are removed on success.
 * Partial sync: line-level stock failures stay local with _syncStatus until retry.
 */
import { getPendingOrders, removeOrder } from "./orderQueue";
import {
  getOfflineOrdersForSync,
  updateOfflineOrderWithBackendTrnsId,
  applyOfflineOrderSyncResult,
} from "./bootstrapLoader";
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
  if (syncInProgress) return { synced: 0, failed: 0, partial: 0 };
  syncInProgress = true;
  let synced = 0;
  let failed = 0;
  let partial = 0;
  try {
    const offlineForSync = await getOfflineOrdersForSync();
    const queuePending = await getPendingOrders();
    const orders = [...offlineForSync, ...queuePending];
    if (orders.length === 0) {
      notifySyncComplete({ synced: 0, failed: 0, partial: 0 });
      return { synced: 0, failed: 0, partial: 0 };
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
      notifySyncComplete({ synced: 0, failed, partial: 0, error: data?.message || res.statusText });
      return { synced: 0, failed, partial: 0 };
    }

    const results = data.results || [];
    const offlinePrefix = "offline_";
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r?.uuid) continue;

      try {
        await applyOfflineOrderSyncResult(r.uuid, r);
      } catch {
        /* IDB */
      }

      if (r.success && r.submitted) {
        if (String(r.uuid).startsWith(offlinePrefix)) {
          try {
            const backendId = r.order_id ?? r.orderId ?? r.trns_id ?? r.TRNS_ID ?? "";
            await updateOfflineOrderWithBackendTrnsId(r.uuid, backendId);
          } catch {
            /* ignore */
          }
        } else {
          try {
            await removeOrder(r.uuid);
          } catch {
            /* ignore */
          }
        }
        synced++;
        continue;
      }

      if (r.partial) {
        partial++;
        continue;
      }

      if (!r.success) {
        failed++;
      }
    }
    notifySyncComplete({ synced, failed, partial });
    return { synced, failed, partial };
  } catch (err) {
    let pq = [];
    let os = [];
    try {
      pq = await getPendingOrders();
    } catch {
      pq = [];
    }
    try {
      os = await getOfflineOrdersForSync();
    } catch {
      os = [];
    }
    failed = pq.length + os.length;
    notifySyncComplete({ synced: 0, failed, partial: 0, error: err?.message });
    return { synced: 0, failed, partial: 0 };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Manual sync for a single offline_* order (used by Existing Orders actions).
 */
export async function syncOneOfflineOrder(offlineId) {
  const id = String(offlineId ?? "").trim();
  if (!id.startsWith("offline_")) return { synced: 0, failed: 0, partial: false };
  if (syncInProgress) return { synced: 0, failed: 0, partial: false };
  syncInProgress = true;
  try {
    const offlineForSync = await getOfflineOrdersForSync();
    const target = offlineForSync.find((o) => String(o.uuid) === id);
    if (!target) {
      notifySyncComplete({ synced: 0, failed: 1, partial: false, error: "Offline order not found for sync." });
      return { synced: 0, failed: 1, partial: false };
    }
    const token = getAuthToken();
    const res = await fetch(SYNC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ orders: [target] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notifySyncComplete({ synced: 0, failed: 1, partial: false, error: data?.message || res.statusText });
      return { synced: 0, failed: 1, partial: false };
    }
    const r = Array.isArray(data.results) ? data.results[0] : null;
    if (!r?.uuid) {
      notifySyncComplete({ synced: 0, failed: 1, partial: false, error: "Sync failed" });
      return { synced: 0, failed: 1, partial: false };
    }

    try {
      await applyOfflineOrderSyncResult(r.uuid, r);
    } catch {
      /* ignore */
    }

    if (r.success && r.submitted) {
      try {
        const backendId = r.order_id ?? r.orderId ?? r.trns_id ?? r.TRNS_ID ?? "";
        await updateOfflineOrderWithBackendTrnsId(r.uuid, backendId);
      } catch {
        /* ignore */
      }
      notifySyncComplete({ synced: 1, failed: 0, partial: false });
      return { synced: 1, failed: 0, partial: false };
    }

    if (r.partial) {
      const msg = r.message || "Some lines could not sync. Check stock and retry.";
      notifySyncComplete({
        synced: 0,
        failed: 0,
        partial: true,
        message: msg,
      });
      return { synced: 0, failed: 0, partial: true, message: msg };
    }

    notifySyncComplete({
      synced: 0,
      failed: 1,
      partial: false,
      error: r?.message || "Sync failed",
    });
    return { synced: 0, failed: 1, partial: false };
  } catch (err) {
    notifySyncComplete({ synced: 0, failed: 1, partial: false, error: err?.message });
    return { synced: 0, failed: 1, partial: false };
  } finally {
    syncInProgress = false;
  }
}

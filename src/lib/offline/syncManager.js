/**
 * Sync manager – detect online, send pending orders to API, remove on success
 */
import { getPendingOrders, removeOrder } from "./orderQueue";
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
    const pending = await getPendingOrders();
    if (pending.length === 0) {
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
      body: JSON.stringify({ orders: pending }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failed = pending.length;
      notifySyncComplete({ synced: 0, failed, error: data?.message || res.statusText });
      return { synced: 0, failed };
    }

    const results = data.results || [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.success && r.uuid) {
        await removeOrder(r.uuid);
        synced++;
      } else {
        failed++;
      }
    }
    notifySyncComplete({ synced, failed });
    return { synced, failed };
  } catch (err) {
    failed = (await getPendingOrders()).length;
    notifySyncComplete({ synced: 0, failed, error: err?.message });
    return { synced: 0, failed };
  } finally {
    syncInProgress = false;
  }
}

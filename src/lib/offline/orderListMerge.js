/**
 * Existing Orders list: pending offline_* rows stay at top regardless of date filter.
 */

export function isPendingOfflineLocalRow(row) {
  const rawId = String(row?.id ?? row?._raw?.id ?? "");
  return (
    rawId.startsWith("offline_") &&
    (row?._raw?.backend_trns_id == null || row?._raw?.backend_trns_id === "")
  );
}

/** Pending offline orders always included; others respect date range. */
export function filterOfflineRowsForDateRange(offlineRows, inDateRangeFn, fromDate, toDate) {
  return (offlineRows || []).filter((o) => {
    if (isPendingOfflineLocalRow({ id: o.id ?? o.trns_id, _raw: o })) return true;
    return inDateRangeFn(
      o.order_date ??
        o.ORDER_DATE ??
        o._orderDateStr ??
        o.dated ??
        o.DATED ??
        o.created_at ??
        o.date,
      fromDate,
      toDate,
    );
  });
}

/**
 * @param {Array} apiOrders - mapped table rows from API
 * @param {Array} offlineMapped - mapped rows from IDB offline store
 * @param {Set<string>} apiKeys - keys from collectApiOrderKeys
 * @param {(a,b)=>number} sortNewestFirst
 */
export function mergeOrdersPinPendingOffline(apiOrders, offlineMapped, apiKeys, sortNewestFirst) {
  const offlineDeduped = (offlineMapped || []).filter((o) => {
    const bid = o._raw?.backend_trns_id;
    if (bid == null || bid === "") return true;
    return !apiKeys.has(String(bid).trim());
  });

  const pending = [];
  const otherOffline = [];
  for (const o of offlineDeduped) {
    if (isPendingOfflineLocalRow(o)) pending.push(o);
    else otherOffline.push(o);
  }

  const apiSorted = sortNewestFirst(apiOrders || []);
  const otherSorted = sortNewestFirst(otherOffline);
  const pendingSorted = sortNewestFirst(pending);

  return [...pendingSorted, ...apiSorted, ...otherSorted];
}

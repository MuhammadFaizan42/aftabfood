/** Helpers for offline order sync failure messages (batch / expiry / stock). */

export function itemKeyOf(it) {
  return String(it?.item_id ?? it?.product_id ?? it?.sku ?? it?.itemIdForApi ?? "").trim();
}

export function itemDisplayName(it) {
  const name = String(
    it?.product_name ?? it?.name ?? it?.itemName ?? it?.sku ?? itemKeyOf(it) ?? "",
  ).trim();
  return name || "Unknown item";
}

export function prefixSyncErrorWithItemName(it, message) {
  const name = itemDisplayName(it);
  const msg = String(message ?? "").trim() || "Could not sync";
  if (msg.toLowerCase().startsWith(name.toLowerCase())) return msg;
  return `${name} — ${msg}`;
}

export function buildPartialSyncMessageFromItems(items) {
  const failed = (items || []).filter((it) => {
    const s = String(it._syncStatus ?? "").toLowerCase();
    return s === "failed" || s === "batch_missing";
  });
  if (failed.length === 0) {
    return "Some lines could not sync. Open View to fix batch, expiry, or stock and retry.";
  }
  const lines = failed.map((it) => prefixSyncErrorWithItemName(it, it._syncError));
  return `Sync incomplete. Fix these items and sync again:\n${lines.map((l) => `• ${l}`).join("\n")}`;
}

export function buildPartialSyncMessageFromLineResults(orderItems, lineResults) {
  const failedResults = (lineResults || []).filter(
    (r) => !r.skipped && !r.already_synced && r.success !== true,
  );
  if (failedResults.length === 0) return null;

  const lines = failedResults.map((lr) => {
    const id = String(lr.item_id ?? "").trim();
    const it = (orderItems || []).find((x) => itemKeyOf(x) === id);
    const name = it ? itemDisplayName(it) : id || "Unknown item";
    const reason = lr.message || "Could not sync";
    return `${name} — ${reason}`;
  });

  return `Sync incomplete. Fix these items and sync again:\n${lines.map((l) => `• ${l}`).join("\n")}`;
}

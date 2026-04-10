"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { bootstrapMasterData } from "./bootstrapLoader";

const SyncStatusContext = createContext(null);

export function SyncStatusProvider({ children }) {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const runSync = useCallback(async (message = "Syncing latest data...") => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    setSyncMessage(message);
    try {
      await bootstrapMasterData(true);
      setSyncMessage("Data refreshed.");
    } catch (err) {
      setSyncMessage("Sync failed. " + (err?.message || "Try again."));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    runSync("Syncing latest data from backend...");
  }, [runSync]);

  // Manual sync only: do not auto-run on online event.

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.serviceWorker) return;
    const handler = (event) => {
      if (event?.data?.type === "ORDERS_SYNCED") {
        // Background sync is for legacy queued orders only; do not auto refresh/sync here.
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  const value = {
    isOnline,
    isSyncing,
    syncMessage,
    triggerRefresh,
  };

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  const ctx = useContext(SyncStatusContext);
  return ctx || {
    isOnline: true,
    isSyncing: false,
    syncMessage: null,
    triggerRefresh: () => {},
  };
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { bootstrapMasterData } from "./bootstrapLoader";
import { syncPendingOrders } from "./syncManager";

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
      const result = await syncPendingOrders();
      if (result.synced > 0) {
        setSyncMessage(`${result.synced} order(s) synced. Data refreshed.`);
      } else {
        setSyncMessage("Data refreshed.");
      }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      runSync("Network available – syncing from backend...");
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [runSync]);

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

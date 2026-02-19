"use client";

import { useEffect } from "react";
import { getDB } from "@/lib/idb";
import { bootstrapMasterData } from "@/lib/offline/bootstrapLoader";
import { registerServiceWorker } from "@/lib/registerSw";

/**
 * Bootstrap master data when online; warm up IndexedDB so cart page reads work offline
 */
export default function OfflineProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    registerServiceWorker();
    getDB().catch(() => {});
    const init = async () => {
      if (navigator.onLine) {
        try {
          await bootstrapMasterData();
        } catch (e) {
          // ignore
        }
      }
    };
    init();
  }, []);

  return children;
}

"use client";

import { useEffect, useRef } from "react";
import { getDB } from "@/lib/idb";
import { bootstrapMasterData } from "@/lib/offline/bootstrapLoader";
import { registerServiceWorker } from "@/lib/registerSw";
import { warmUpCriticalRoutes } from "@/lib/offline/warmUpRoutes";

/**
 * Same behaviour on localhost and production: register SW, IndexedDB, bootstrap data,
 * and warm up critical routes so offline works like local. Warm-up caches HTML+chunks
 * for /, /new-order, /dashboard once per day when online so they don't crash offline.
 */
export default function OfflineProvider({ children }) {
  const bootingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    registerServiceWorker();
    getDB().catch(() => {});

    const runBootstrap = async () => {
      if (!navigator.onLine || bootingRef.current) return;
      bootingRef.current = true;
      try {
        await bootstrapMasterData();
      } catch {
        // ignore
      } finally {
        bootingRef.current = false;
      }
    };

    runBootstrap();

    /* When online, warm up critical routes (/, /new-order, /dashboard) in background so
       SW caches HTML + JS chunks. Runs at most once per 24h. Ensures offline = localhost. */
    const t = setTimeout(() => {
      if (navigator.onLine) {
        const current = window.location.pathname + window.location.search;
        warmUpCriticalRoutes([current]).catch(() => {});
      }
    }, 4000);

    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) runBootstrap();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return children;
}


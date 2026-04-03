"use client";

import { useEffect } from "react";

const STORAGE_KEY = "aftab-chunk-reload-once";

function isChunkLoadFailure(reason) {
  if (!reason) return false;
  const msg = reason?.message != null ? String(reason.message) : String(reason);
  return (
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed")
  );
}

/** One reload after chunk 404 — helps stale cache after deploy (runs after React mounts). */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    const onRejection = (e) => {
      if (!isChunkLoadFailure(e.reason)) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      e.preventDefault();
      window.location.reload();
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return null;
}

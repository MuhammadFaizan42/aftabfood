"use client";

import { useState, useEffect } from "react";

/**
 * Shows an "Install app" prompt when the browser supports PWA install (beforeinstallprompt).
 * Dismissible; preference stored in localStorage so we don't show again for a while.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "pwa_install_dismissed";
    const dismissedAt = parseInt(localStorage.getItem(key) || "0", 10);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) setDismissed(true);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    if (typeof window !== "undefined") localStorage.setItem("pwa_install_dismissed", String(Date.now()));
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Install Three Lines</p>
        <p className="text-xs text-gray-500">Use offline and get quick access from your home screen.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches client-side errors (e.g. ChunkLoadError when offline on Hostinger –
 * a chunk fails to load and Next.js throws). Shows a friendly message and Retry.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  const isChunkOrNetwork =
    error?.name === "ChunkLoadError" ||
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("network");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          {isChunkOrNetwork ? (
            <>
              The page could not load, often when you&apos;re offline. Open this
              page once while <strong>online</strong>, then try again offline.
            </>
          ) : (
            <>A client-side error occurred. You can try again or go back.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors text-center"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}

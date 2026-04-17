"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/common/Header";
import { getAuthToken } from "@/lib/api";
import { uploadProductImage } from "@/services/shetApi";

function onlyDigits(s) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

export default function ProductImagesPage() {
  const [imageId, setImageId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file]);

  const canUpload = onlyDigits(imageId).length > 0 && !!file && !busy;

  const handleUpload = async () => {
    const id = onlyDigits(imageId);
    if (!id) {
      setError("Image name must be numeric (e.g. 12345).");
      return;
    }
    if (!file) {
      setError("Please select an image file first.");
      return;
    }
    if (!getAuthToken()) {
      setError("Please log in first — image upload uses your account on the server.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await uploadProductImage(id, file);
      const data = res?.data != null && typeof res.data === "object" ? res.data : {};
      const imageUrl = String(data.url ?? data.IMAGE_URL ?? data.image_url ?? "").trim();
      const filename = String(data.filename ?? "").trim();
      setSuccess({
        id,
        message: typeof res?.message === "string" ? res.message : "",
        imageUrl,
        filename,
      });
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Product Images Upload
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the product ID (numeric) and choose an image file to upload to the server.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Product ID (numeric)
              </label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 105754"
                value={imageId}
                onChange={(e) => setImageId(onlyDigits(e.target.value))}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Digits only — must match the product inventory ID (PK_INV_ID).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Select image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG / JPG / WEBP recommended.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded bg-white border border-gray-200"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-gray-500">
                  No image selected
                </div>
              )}
            </div>

            <div className="space-y-3">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
                  <div className="font-medium">Uploaded</div>
                  {success.message ? <div className="mt-1">{success.message}</div> : null}
                  <div className="mt-1">
                    <span className="text-gray-600">ID:</span>{" "}
                    <span className="font-mono">{success.id}</span>
                    {success.filename ? (
                      <>
                        {" "}
                        <span className="text-gray-600">·</span>{" "}
                        <span className="font-mono">{success.filename}</span>
                      </>
                    ) : null}
                  </div>
                  {success.imageUrl ? (
                    <div className="mt-1 break-words">
                      <span className="text-gray-600">Link:</span>{" "}
                      <a className="text-teal-700 hover:underline" href={success.imageUrl} target="_blank" rel="noreferrer">
                        {success.imageUrl}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-green-900/80">
                      No link returned — check the product list for the updated image.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={!canUpload}
                onClick={handleUpload}
                className="w-full h-11 inline-flex items-center justify-center rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>

              <div className="text-xs text-gray-500">
                Tip: uploading again for the same PK_INV_ID usually replaces the previous image on the server.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


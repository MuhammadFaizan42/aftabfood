import { getApiBaseUrl, getAuthToken } from "@/lib/api";

const DEFAULT_TIMEOUT_MS = 14000;

function resolveImageUrl(url) {
  if (!url || !String(url).trim()) return "";
  const u = String(url).trim();
  if (u.startsWith("data:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return `https:${u}`;

  const base = getApiBaseUrl();
  let origin;
  try {
    origin = new URL(base).origin;
  } catch {
    origin = "https://api.otwoostores.com";
  }

  if (u.startsWith("/")) {
    return `${origin}${u}`;
  }
  const join = base.endsWith("/") ? base : `${base}/`;
  try {
    return new URL(u, join).href;
  } catch {
    return `${origin}/${u.replace(/^\/+/, "")}`;
  }
}

function catalogApiHostname() {
  try {
    return new URL(getApiBaseUrl()).hostname;
  } catch {
    return "api.otwoostores.com";
  }
}

function formatFromDataUrl(dataUrl) {
  const m = /^data:image\/(\w+);/i.exec(dataUrl);
  if (!m) return "JPEG";
  const t = m[1].toLowerCase();
  if (t === "png") return "PNG";
  if (t === "jpeg" || t === "jpg") return "JPEG";
  if (t === "webp") return "WEBP";
  return "JPEG";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

function naturalSizeFromDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });
}

async function loadImageWithResponse(res) {
  if (!res?.ok) return null;
  const blob = await res.blob();
  if (!blob || blob.size < 32) return null;
  const dataUrl = await blobToDataUrl(blob);
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const { w, h } = await naturalSizeFromDataUrl(dataUrl);
  if (!w || !h) return null;
  return { dataUrl, format: formatFromDataUrl(dataUrl), w, h };
}

/**
 * Fetch image for embedding in jsPDF (CORS + /api/catalog-image proxy + auth for API host).
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ dataUrl: string; format: string; w: number; h: number } | null>}
 */
export async function loadImageForPdf(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const resolved = resolveImageUrl(url);
  if (!resolved) return null;

  if (resolved.startsWith("data:")) {
    try {
      const { w, h } = await naturalSizeFromDataUrl(resolved);
      if (!w || !h) return null;
      return { dataUrl: resolved, format: formatFromDataUrl(resolved), w, h };
    } catch {
      return null;
    }
  }

  const authHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAsPdfImage = async (urlToFetch, mode, cache, headers = {}) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(urlToFetch, { mode, signal: ctrl.signal, cache, headers });
      return await loadImageWithResponse(res);
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  };

  let imgHost = "";
  try {
    imgHost = new URL(resolved).hostname;
  } catch {
    /* ignore */
  }
  const apiHost = catalogApiHostname();
  const proxy =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/catalog-image?url=${encodeURIComponent(resolved)}`
      : "";

  let out = null;
  if (proxy && imgHost === apiHost) {
    out = await fetchAsPdfImage(proxy, "same-origin", "no-store", authHeaders());
  }
  if (!out) {
    out = await fetchAsPdfImage(resolved, "cors", "force-cache");
  }
  if (!out && proxy && imgHost !== apiHost) {
    out = await fetchAsPdfImage(proxy, "same-origin", "no-store", authHeaders());
  }
  return out;
}

export function fitImageToBox(nw, nh, maxW, maxH) {
  const r = Math.min(maxW / nw, maxH / nh, 1);
  return { w: nw * r, h: nh * r };
}

import { NextResponse } from "next/server";

const DEFAULT_API_BASE = "https://api.otwoostores.com/restful";
const MAX_BYTES = 12 * 1024 * 1024;

function configuredApiHostname() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE;
  try {
    return new URL(raw).hostname;
  } catch {
    try {
      return new URL(DEFAULT_API_BASE).hostname;
    } catch {
      return "api.otwoostores.com";
    }
  }
}

function isBlockedHostname(host) {
  const h = String(host).toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0") return true;
  if (h.startsWith("127.")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  const m = /^172\.(\d+)\./.exec(h);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (h.startsWith("169.254.")) return true;
  if (h === "::1" || h === "[::1]") return true;
  if (h.includes("metadata.google.internal")) return true;
  return false;
}

function sniffImageContentType(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8.length < 2) return null;
  if (u8[0] === 0xff && u8[1] === 0xd8) return "image/jpeg";
  if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return "image/png";
  if (u8.length >= 6 && u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return "image/gif";
  if (u8.length >= 12 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) return "image/webp";
  return null;
}

/**
 * Server-side image fetch for PDF catalog — browser fetch() often fails on IMAGE_URL (no CORS).
 * GET /api/catalog-image?url=<encoded https image URL>
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl || !String(rawUrl).trim()) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target;
  try {
    target = new URL(decodeURIComponent(rawUrl));
  } catch {
    try {
      target = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "only http(s)" }, { status: 400 });
  }

  if (isBlockedHostname(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const apiHost = configuredApiHostname();
  const upstreamHeaders = {
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (target.hostname === apiHost) {
    const auth = request.headers.get("authorization");
    if (auth) upstreamHeaders.Authorization = auth;
    upstreamHeaders.Referer = `${target.protocol}//${target.host}/`;
  }

  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "too large" }, { status: 413 });
    }

    if (buf.byteLength < 32) {
      return NextResponse.json({ error: "empty" }, { status: 502 });
    }

    const bytes = new Uint8Array(buf);
    let ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!ct.startsWith("image/")) {
      const sniffed = sniffImageContentType(bytes);
      if (sniffed) ct = sniffed;
      else {
        return NextResponse.json({ error: "not an image" }, { status: 415 });
      }
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}

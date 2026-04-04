import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export const runtime = "nodejs";
/** Vercel / adapters: allow long-running submit_order upstream calls */
export const maxDuration = 300;

const UPSTREAM_TIMEOUT_MS = 300000;

/**
 * Server proxy for sale_order.php POST — avoids browser CORS; must hit SAME API host as client (getApiBaseUrl).
 * POST /api/sale-order?action=submit_order
 */
export async function POST(request) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ success: false, message: "Authorization required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  if (!action || !String(action).trim()) {
    return NextResponse.json({ success: false, message: "action query required" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const base = getApiBaseUrl();
  const target = `${base}/models/sale_order.php?action=${encodeURIComponent(action)}`;

  if (process.env.NODE_ENV === "development") {
    console.info("[sale-order proxy]", action, "->", target);
  }

  const ac = new AbortController();
  const kill = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: auth,
        Referer: `${base}/`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: ac.signal,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        success: false,
        message: text?.slice(0, 300) || "Non-JSON response from server",
      };
    }

    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    const aborted = e?.name === "AbortError";
    const msg = aborted
      ? `Upstream request timed out after ${Math.round(UPSTREAM_TIMEOUT_MS / 1000)}s. Check API server or set NEXT_PUBLIC_API_BASE_URL / API_BASE_URL to the same host you use in the app (e.g. https://api.otwoostores.com/restful).`
      : e?.message || "Proxy failed";
    return NextResponse.json({ success: false, message: msg }, { status: 502 });
  } finally {
    clearTimeout(kill);
  }
}

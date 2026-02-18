import { NextResponse } from "next/server";

const OTWOO_BASE = "https://api.otwoostores.com/restful";

/**
 * Proxy for sale_returns API – browser se direct call pe CORS/ERR_FAILED aa sakta hai,
 * isliye request server se bhejte hain.
 * GET /api/sale-returns?party_code=9886&from_date=2025-01-01&to_date=2026-02-15
 * Header: Authorization: Bearer <token>
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const partyCode = searchParams.get("party_code");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");

  const auth = request.headers.get("authorization");

  if (!partyCode) {
    return NextResponse.json(
      { success: false, message: "party_code is required" },
      { status: 400 }
    );
  }

  const q = new URLSearchParams({ party_code: partyCode });
  if (fromDate) q.set("from_date", fromDate);
  if (toDate) q.set("to_date", toDate);

  const url = `${OTWOO_BASE}/models/sale_return.php?${q.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(auth && { Authorization: auth }),
      },
    });

    const data = await res.text();
    let body;
    try {
      body = JSON.parse(data);
    } catch {
      body = { success: false, message: data || "Invalid response" };
    }

    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Proxy request failed" },
      { status: 502 }
    );
  }
}

/**
 * Order review / submit payloads often omit full party address & phone; merge from dashboard or IDB (same idea as existing-orders share).
 */
import { getPartySaleInvDashboard } from "@/services/shetApi";
import { getCachedCustomerDashboard, getCachedCustomers } from "@/lib/offline/bootstrapLoader";
import { getSaleOrderPartyCode } from "@/lib/api";
import { normalizeOrderCustomer } from "@/lib/orderCustomerNormalize";

function pickStr(a, b) {
  const sa = a != null ? String(a).trim() : "";
  const sb = b != null ? String(b).trim() : "";
  return sa || sb;
}

/** @param {string} partyCode */
export async function resolveCustomerMasterRecord(partyCode, isOnline) {
  const pc = String(partyCode || "").trim();
  if (!pc) return null;

  if (isOnline) {
    try {
      const res = await getPartySaleInvDashboard(pc, {});
      const c = res?.data?.customer ?? res?.data?.data?.customer ?? null;
      if (c && typeof c === "object") return c;
    } catch {
      /* fall through */
    }
  }

  try {
    const dash = await getCachedCustomerDashboard(pc);
    const c = dash?.customer ?? dash?.data?.customer ?? null;
    if (c && typeof c === "object") return c;
  } catch {
    /* ignore */
  }

  try {
    const customers = await getCachedCustomers();
    const found = customers.find(
      (x) => String(x.SHORT_CODE ?? x.CUSTOMER_ID ?? x.PARTY_CODE ?? x.code ?? "").trim() === pc,
    );
    return found || null;
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown> | null} details - `mapOrderDetails()` result */
export async function enrichOrderDetailsWithCustomerMaster(details, isOnline) {
  if (!details || typeof details !== "object" || !details.customer) return details;
  const root = details._orderRoot && typeof details._orderRoot === "object" ? details._orderRoot : {};

  const partyCode = pickStr(
    details.customer.SHORT_CODE,
    root.party_code,
    root.PARTY_CODE,
    root.customer_id,
    root.CUSTOMER_ID,
    root.account_id,
    typeof window !== "undefined" ? getSaleOrderPartyCode() : "",
  );
  if (!partyCode) return details;

  const master = await resolveCustomerMasterRecord(partyCode, isOnline);
  if (!master) return details;

  const base = normalizeOrderCustomer(details.customer, root);
  const extra = normalizeOrderCustomer(master, root);

  const nameA = base.CUSTOMER_NAME && base.CUSTOMER_NAME !== "—" ? base.CUSTOMER_NAME : "";
  const nameB = extra.CUSTOMER_NAME && extra.CUSTOMER_NAME !== "—" ? extra.CUSTOMER_NAME : "";

  const customer = {
    ...details.customer,
    CUSTOMER_NAME: pickStr(nameA, nameB) || "—",
    SHORT_CODE: pickStr(base.SHORT_CODE, extra.SHORT_CODE) || partyCode,
    ADRES: pickStr(base.ADRES, extra.ADRES),
    CONT_PERSON: pickStr(base.CONT_PERSON, extra.CONT_PERSON),
    CONT_NUM: pickStr(base.CONT_NUM, extra.CONT_NUM),
  };

  return { ...details, customer };
}

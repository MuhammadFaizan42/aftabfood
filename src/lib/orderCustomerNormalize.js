/**
 * Order API (order_review / cached detail) often splits customer across `customer` and root `data`.
 * Normalize to stable fields for PDF / share text.
 */

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

/**
 * @param {Record<string, unknown>} rawCustomer - d.customer | d.customer_info | d.party
 * @param {Record<string, unknown>} d - full order payload root
 */
export function normalizeOrderCustomer(rawCustomer = {}, d = {}) {
  const r = rawCustomer && typeof rawCustomer === "object" ? rawCustomer : {};

  const name = firstNonEmpty(
    r.CUSTOMER_NAME,
    r.customer_name,
    r.name,
    d.party_name,
    d.customer_name,
    d.PARTY_NAME,
    d.CUSTOMER_NAME,
  );

  const code = firstNonEmpty(
    r.SHORT_CODE,
    r.party_code,
    r.PARTY_CODE,
    r.customer_id,
    r.account_id,
    r.CUSTOMER_CODE,
    r.CUST_CODE,
    r.PARTY_ID,
    d.party_code,
    d.PARTY_CODE,
    d.customer_id,
    d.account_id,
    d.CUSTOMER_ID,
  );

  const lineFromParts = [
    r.ST,
    r.ADRES,
    r.ADDRESS,
    r.address,
    r.DIVISION,
    r.PROVINCES,
    r.TEHSIL,
    r.AREA_DIS,
    r.TOWN,
    r.CITY,
    r.POSTCODE,
    r.POST_CODE,
    r.post_code,
    r.postCode,
    r.ZIP,
  ]
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean)
    .join(", ");

  const address = firstNonEmpty(
    lineFromParts,
    typeof r.ADRES === "string" ? r.ADRES : "",
    r.address,
    r.ADDRESS,
    r.delivery_address,
    r.DELIVERY_ADDRESS,
    r.FULL_ADDRESS,
    r.CUST_ADDRESS,
    r.DEL_ADDRESS,
    r.BILL_TO_ADDRESS,
    r.party_address,
    r.ADDR_LINE1 && [r.ADDR_LINE1, r.ADDR_LINE2, r.ADDR_LINE3].filter(Boolean).join(", "),
    d.ADRES,
    d.address,
    d.delivery_address,
    d.DELIVERY_ADDRESS,
    d.party_address,
    d.ship_to_address,
  );

  const contact = firstNonEmpty(
    r.CONT_PERSON,
    r.CONTACT_PERSON,
    r.contactPerson,
    r.CONTACT_NAME,
    r.PIC_NAME,
    r.contact_name,
    r.CONT_NAME,
    r.cont_person,
    r.contact_person,
    d.CONT_PERSON,
    d.CONTACT_PERSON,
    d.cont_person,
  );

  const phone = firstNonEmpty(
    r.CONT_NUM,
    r.contactNum,
    r.cont_num,
    r.MOBILE,
    r.PHONE,
    r.TEL,
    r.TELEPHONE,
    r.MOBILE_NO,
    r.CONTACT_NO,
    r.CELL,
    r.mobile,
    r.PHONE_NO,
    r.tel,
    d.CONT_NUM,
    d.MOBILE,
    d.PHONE,
    d.cont_num,
    d.mobile,
  );

  return {
    ...r,
    CUSTOMER_NAME: name || "—",
    SHORT_CODE: code,
    ADRES: address,
    CONT_PERSON: contact,
    CONT_NUM: phone,
  };
}

/** Display line for PDF / UI — empty -> em dash */
export function displayCustomerField(v) {
  const s = v != null ? String(v).trim() : "";
  return s || "—";
}

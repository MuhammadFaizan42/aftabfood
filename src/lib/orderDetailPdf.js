import { loadImageForPdf, fitImageToBox } from "@/lib/pdf/loadImageForPdf";
import { normalizeOrderCustomer, displayCustomerField } from "@/lib/orderCustomerNormalize";

/**
 * Sales order PDF for sharing with customer: header, customer block, line items with images, totals.
 * @param {{
 *   saleOrderLabel?: string;
 *   orderDate?: string;
 *   customer?: Record<string, unknown>;
 *   orderRoot?: Record<string, unknown>;
 *   items?: Array<{ name?: string; quantity?: number; unitPrice?: number; total?: number; sku?: string; batch?: string; uom?: string; image?: string }>;
 *   subtotal?: number;
 *   tax?: number;
 *   discount?: number;
 *   grandTotal?: number;
 *   deliveryDate?: string;
 *   payTerms?: string;
 *   remarks?: string;
 * }} payload
 */
export async function buildOrderDetailPdfBlob(payload) {
  const {
    saleOrderLabel = "—",
    orderDate = "",
    customer = {},
    orderRoot = {},
    items = [],
    subtotal = 0,
    tax = 0,
    discount = 0,
    grandTotal = 0,
    deliveryDate = "",
    payTerms = "",
    remarks = "",
  } = payload;

  const { jsPDF } = await import("jspdf");
  const margin = 12;
  const pageW = 210;
  const pageH = 297;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = margin;

  const root = orderRoot && typeof orderRoot === "object" ? orderRoot : {};
  const c = normalizeOrderCustomer(
    customer && typeof customer === "object" ? customer : {},
    root,
  );
  const custName = displayCustomerField(c.CUSTOMER_NAME);
  const custCode = displayCustomerField(c.SHORT_CODE);
  const address = displayCustomerField(c.ADRES);
  const contact = displayCustomerField(c.CONT_PERSON);
  const phone = displayCustomerField(c.CONT_NUM);

  function footerAllPages() {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, margin, pageH - 6);
      const right = `Page ${i} of ${total}`;
      doc.text(right, pageW - margin, pageH - 6, { align: "right" });
      doc.setTextColor(0);
    }
  }

  function newPage() {
    doc.addPage();
    y = margin;
  }

  function ensureSpace(mm) {
    if (y + mm > pageH - 14) newPage();
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(30, 41, 59);
  doc.text("Sales order", margin, y);
  y += 9;
  doc.setFontSize(11);
  doc.text(`Sale order no.: ${String(saleOrderLabel)}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const metaLine =
    orderDate && String(orderDate).trim()
      ? `Order date: ${String(orderDate).trim()}`
      : `Printed: ${new Date().toLocaleDateString("en-GB")}`;
  doc.text(metaLine, margin, y);
  y += 10;
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Customer details", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const custBits = [
    `Name: ${custName}`,
    `Customer code: ${custCode}`,
    `Address: ${address}`,
    `Contact person: ${contact}`,
    `Phone / Mobile: ${phone}`,
  ];
  for (const bit of custBits) {
    const wrapped = doc.splitTextToSize(String(bit), pageW - 2 * margin);
    const lines = Array.isArray(wrapped) ? wrapped : [String(wrapped)];
    for (const ln of lines) {
      ensureSpace(5);
      doc.text(ln, margin, y);
      y += 4.3;
    }
  }
  if (deliveryDate && String(deliveryDate).trim()) {
    ensureSpace(5);
    doc.text(`Delivery date: ${String(deliveryDate).trim()}`, margin, y);
    y += 4.5;
  }
  if (payTerms && String(payTerms).trim()) {
    const w = doc.splitTextToSize(`Payment terms: ${String(payTerms).trim()}`, pageW - 2 * margin);
    const arr = Array.isArray(w) ? w : [String(w)];
    for (const ln of arr) {
      ensureSpace(5);
      doc.text(ln, margin, y);
      y += 4.2;
    }
  }
  y += 6;

  if (remarks && String(remarks).trim()) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Remarks", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const rw = doc.splitTextToSize(String(remarks).trim(), pageW - 2 * margin);
    const rlines = Array.isArray(rw) ? rw : [String(rw)];
    for (const ln of rlines.slice(0, 8)) {
      ensureSpace(4.5);
      doc.text(ln, margin, y);
      y += 4;
    }
    y += 4;
  }

  ensureSpace(12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Line items", margin, y);
  y += 7;
  doc.setDrawColor(210);
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  const imgBox = 20;
  const textX = margin + imgBox + 4;
  const rowMinH = 22;

  for (const it of items) {
    ensureSpace(rowMinH + 6);
    const topY = y;

    const imgData = await loadImageForPdf(it.image || "");
    doc.setDrawColor(229, 231, 235);
    if (imgData) {
      const { w: iw, h: ih } = fitImageToBox(imgData.w, imgData.h, imgBox - 1, rowMinH - 1);
      const ix = margin + (imgBox - iw) / 2;
      const iy = topY + (rowMinH - ih) / 2;
      try {
        doc.addImage(imgData.dataUrl, imgData.format, ix, iy, iw, ih, undefined, "FAST");
      } catch {
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, topY, imgBox, rowMinH, "F");
      }
    } else {
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, topY, imgBox, rowMinH, "F");
      doc.setFontSize(6);
      doc.setTextColor(150);
      const lbl = "No image";
      doc.text(lbl, margin + imgBox / 2, topY + rowMinH / 2, { align: "center" });
      doc.setTextColor(0);
    }
    doc.rect(margin, topY, imgBox, rowMinH, "S");

    let ty = topY + 3.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const nameW = pageW - textX - margin;
    const nameLines = doc.splitTextToSize(String(it.name || "—").slice(0, 220), nameW);
    const nameSlice = Array.isArray(nameLines) ? nameLines.slice(0, 2) : [String(nameLines)];
    doc.text(nameSlice, textX, ty);
    ty += nameSlice.length * 3.6 + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(55, 65, 81);
    const sku = String(it.sku ?? "—").slice(0, 28);
    const batch = String(it.batch ?? "—").slice(0, 22);
    const uom = String(it.uom ?? "—").slice(0, 16);
    doc.text(`SKU: ${sku}    Batch: ${batch}    UOM: ${uom}`, textX, ty);
    ty += 3.8;
    const qty = Number(it.quantity) || 0;
    const up = Number(it.unitPrice) || 0;
    const rawLine = Number(it.total);
    const lineTot = Number.isFinite(rawLine) ? rawLine : Math.round(qty * up * 100) / 100;
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Qty: ${qty}  ×  £${up.toFixed(2)}  =  £${lineTot.toFixed(2)}`, textX, ty);
    doc.setFont("helvetica", "normal");

    y = topY + rowMinH + 5;
    doc.setDrawColor(238);
    doc.line(margin, y - 2, pageW - margin, y - 2);
  }

  ensureSpace(32);
  y += 4;
  const labelX = pageW - margin - 62;
  const valueX = pageW - margin;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Subtotal:", labelX, y);
  doc.text(`£${Number(subtotal).toFixed(2)}`, valueX, y, { align: "right" });
  y += 5.5;
  if (Number(tax) !== 0) {
    doc.text("Tax:", labelX, y);
    doc.text(`£${Number(tax).toFixed(2)}`, valueX, y, { align: "right" });
    y += 5.5;
  }
  if (Number(discount) !== 0) {
    doc.text("Discount:", labelX, y);
    doc.text(`£${Number(discount).toFixed(2)}`, valueX, y, { align: "right" });
    y += 5.5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Grand total:", labelX, y);
  doc.text(`£${Number(grandTotal).toFixed(2)}`, valueX, y, { align: "right" });

  footerAllPages();
  return doc.output("blob");
}

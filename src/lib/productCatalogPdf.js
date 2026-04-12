import { loadImageForPdf, fitImageToBox } from "@/lib/pdf/loadImageForPdf";

/**
 * Product catalog PDF with images — 4 columns × 4 rows (16 items per A4 portrait page).
 * Client-only; dynamic import of jsPDF keeps initial bundle smaller.
 *
 * @param {Array<{ image?: string; category?: string; name?: string; sku?: string; uom?: string; price?: string; inStock?: boolean; stock?: number | string }>} items
 * @param {{ title?: string; subtitle?: string; showPrice?: boolean }} options
 * @returns {Promise<Blob>}
 */
export async function buildProductCatalogPdfBlob(items, options = {}) {
  const { title = "Product catalog", subtitle = "", showPrice = false } = options;
  const { jsPDF } = await import("jspdf");

  const GRID_COLS = 4;
  const GRID_ROWS = 4;
  const PER_PAGE = GRID_COLS * GRID_ROWS;
  const MARGIN_X = 7;
  const MARGIN_TOP = 7;
  const FOOTER_H = 10;
  const HEADER_BASE = 11;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const innerW = pageW - MARGIN_X * 2;

  function drawHeader(docRef) {
    docRef.setFont("helvetica", "bold");
    docRef.setFontSize(12);
    docRef.setTextColor(17, 24, 39);
    docRef.text(title, MARGIN_X, MARGIN_TOP + 5);

    let y = MARGIN_TOP + HEADER_BASE;
    if (subtitle) {
      docRef.setFont("helvetica", "normal");
      docRef.setFontSize(7.5);
      docRef.setTextColor(80, 80, 80);
      const lines = docRef.splitTextToSize(subtitle, innerW);
      const subLines = Array.isArray(lines) ? lines.slice(0, 3) : [String(lines)];
      docRef.text(subLines, MARGIN_X, y);
      y += subLines.length * 3.4 + 1;
      docRef.setTextColor(0, 0, 0);
    }

    const gridTop = y + 2;
    docRef.setDrawColor(220);
    docRef.setLineWidth(0.2);
    docRef.line(MARGIN_X, gridTop - 1, pageW - MARGIN_X, gridTop - 1);

    return gridTop;
  }

  function drawFooter(docRef, pageIndex, totalPages) {
    docRef.setFontSize(7);
    docRef.setTextColor(120);
    docRef.setFont("helvetica", "normal");
    const left = `Generated ${new Date().toLocaleString("en-GB")}`;
    const right = `Page ${pageIndex + 1} of ${totalPages}`;
    docRef.text(left, MARGIN_X, pageH - 5);
    docRef.text(right, pageW - MARGIN_X - docRef.getTextWidth(right), pageH - 5);
    docRef.setTextColor(0, 0, 0);
  }

  function drawPlaceholder(docRef, x, y, w, h) {
    docRef.setFillColor(243, 244, 246);
    docRef.roundedRect(x, y, w, h, 1, 1, "F");
    docRef.setFont("helvetica", "normal");
    docRef.setFontSize(7);
    docRef.setTextColor(150, 150, 150);
    const label = "No image";
    docRef.text(label, x + w / 2 - docRef.getTextWidth(label) / 2, y + h / 2);
    docRef.setTextColor(0, 0, 0);
  }

  function isOutOfStock(p) {
    if (p == null) return false;
    if (typeof p.inStock === "boolean") return !p.inStock;
    const n = Number(p.stock ?? NaN);
    if (!Number.isNaN(n)) return n <= 0;
    return false;
  }

  function drawOutOfStockBadge(docRef, x, y) {
    const label = "OUT OF STOCK";
    docRef.setFont("helvetica", "bold");
    docRef.setFontSize(6.2);
    const padX = 2.2;
    const padY = 1.6;
    const w = docRef.getTextWidth(label) + padX * 2;
    const h = 5.2;
    docRef.setFillColor(220, 38, 38);
    docRef.roundedRect(x, y, w, h, 1.2, 1.2, "F");
    docRef.setTextColor(255, 255, 255);
    docRef.text(label, x + padX, y + h - padY);
    docRef.setTextColor(0, 0, 0);
  }

  function drawProductCell(docRef, col, row, cellW, cellH, gridTop, product, imageData, cellShowPrice) {
    const cellX = MARGIN_X + col * cellW;
    const cellY = gridTop + row * cellH;
    const pad = 1.5;
    const innerCellW = cellW - pad * 2;
    const innerTop = cellY + pad;

    const imgBoxW = innerCellW;
    const imgBoxH = Math.min(26, cellH * 0.42);
    const imgBoxX = cellX + pad;
    const imgBoxY = innerTop;

    const textW = innerCellW - 1;
    const textX = cellX + pad + 0.5;

    docRef.setFont("helvetica", "bold");
    docRef.setFontSize(7);
    const nameLines = docRef.splitTextToSize(String(product.name ?? "—").slice(0, 92), textW);
    const nameSlice = Array.isArray(nameLines) ? nameLines.slice(0, 2) : [String(nameLines)];

    const textStartY = imgBoxY + imgBoxH + 2;
    const priceExtra =
      cellShowPrice && product.price != null && String(product.price).trim() !== "" ? 2.8 : 0;
    // Enough height for: category + 2 name lines + SKU + UOM (+ optional price) (+ small padding)
    const contentBottom =
      textStartY + 2.6 + nameSlice.length * 3.2 + 1 + 2.6 + 2.6 + priceExtra + 1.2;
    const boxH = Math.min(cellH, contentBottom - cellY);

    docRef.setDrawColor(229, 231, 235);
    docRef.setLineWidth(0.25);
    docRef.roundedRect(cellX, cellY, cellW, boxH, 1.2, 1.2, "S");

    if (imageData) {
      const { w: dw, h: dh } = fitImageToBox(imageData.w, imageData.h, imgBoxW, imgBoxH);
      const ix = imgBoxX + (imgBoxW - dw) / 2;
      const iy = imgBoxY + (imgBoxH - dh) / 2;
      try {
        docRef.addImage(imageData.dataUrl, imageData.format, ix, iy, dw, dh, undefined, "FAST");
      } catch {
        drawPlaceholder(docRef, imgBoxX, imgBoxY, imgBoxW, imgBoxH);
      }
    } else {
      drawPlaceholder(docRef, imgBoxX, imgBoxY, imgBoxW, imgBoxH);
    }

    // Draw badge AFTER image so it never gets covered.
    if (isOutOfStock(product)) {
      drawOutOfStockBadge(docRef, cellX + pad + 0.6, cellY + pad + 0.6);
    }

    let ty = textStartY;

    docRef.setFont("helvetica", "normal");
    docRef.setFontSize(5.6);
    docRef.setTextColor(100, 100, 100);
    const cat = String(product.category ?? "—").slice(0, 42);
    docRef.text(cat, textX, ty);
    ty += 2.6;

    docRef.setFont("helvetica", "bold");
    docRef.setFontSize(7);
    docRef.setTextColor(17, 24, 39);
    docRef.text(nameSlice, textX, ty);
    ty += nameSlice.length * 3.2 + 1;

    docRef.setFont("helvetica", "normal");
    docRef.setFontSize(5.9);
    docRef.setTextColor(75, 85, 99);
    const skuLine = `SKU: ${String(product.sku ?? "—").slice(0, 18)}`;
    docRef.text(skuLine, textX, ty);
    ty += 2.6;
    const uomLine = `UOM: ${String(product.uom ?? "—").slice(0, 16)}`;
    docRef.text(uomLine, textX, ty);
    ty += 2.6;

    if (cellShowPrice && product.price != null && String(product.price).trim() !== "") {
      docRef.setFont("helvetica", "bold");
      docRef.setFontSize(6.4);
      docRef.setTextColor(22, 101, 52);
      const pl = String(product.price).trim().slice(0, 24);
      docRef.text(pl, textX, ty);
    }
    docRef.setTextColor(0, 0, 0);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();
    const gridTop = drawHeader(doc);
    const gridBottom = pageH - FOOTER_H;
    const gridH = gridBottom - gridTop;
    const cellW = innerW / GRID_COLS;
    const cellH = gridH / GRID_ROWS;

    const slice = items.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
    const imageDataList = await Promise.all(slice.map((it) => loadImageForPdf(it?.image)));

    for (let i = 0; i < slice.length; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      drawProductCell(doc, col, row, cellW, cellH, gridTop, slice[i], imageDataList[i], showPrice);
    }

    drawFooter(doc, p, totalPages);
  }

  return doc.output("blob");
}

/**
 * Try native share (mobile: WhatsApp etc. with file). Else download + return suggested WhatsApp text.
 */
export async function shareOrDownloadPdf(blob, filename, whatsappHint) {
  const file = new File([blob], filename, { type: "application/pdf" });
  const shareData = { files: [file], title: "Product catalog", text: whatsappHint };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { method: "share" };
      }
    } catch {
      /* download + WhatsApp link below */
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }

  const text = `${whatsappHint}\n\n(File saved: ${filename})`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  if (typeof window !== "undefined") {
    window.open(wa, "_blank", "noopener,noreferrer");
  }
  return { method: "download" };
}

// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { API_URL } from "../config";

/**
 * Generate invoice PDF and open in a new tab.
 * Respects PDF settings (page size, orientation, footer) and renders business details.
 * Logo is optional: if missing or cannot be loaded, it is simply skipped.
 */
export const generatePDF = async (sale) => {
  try {
    if (!sale) throw new Error("No sale data provided.");

    // Fetch settings (business + pdfSettings)
    let settings = {};
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      settings = data || {};
    } catch (err) {
      console.warn("Failed to fetch settings:", err?.message || err);
      settings = {};
    }

    // Create doc with settings
    const doc = new jsPDF({
      orientation: settings?.pdfSettings?.orientation || "portrait",
      unit: "mm",
      format: (settings?.pdfSettings?.pageSize || "A4").toLowerCase(),
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Prepare invoice metadata
    const invoiceId =
      sale.invoiceNumber ||
      sale._id ||
      `TEMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const saleDate = new Date(sale.date || sale.createdAt || Date.now()).toLocaleString();
    const itemsArr = Array.isArray(sale.items) ? sale.items : [];

    // ===== HEADER =====
    // Try to render logo if available; skip silently if not present or cannot be loaded
    if (settings?.businessLogoUrl) {
      try {
        const logoImg = await loadImage(settings.businessLogoUrl);
        // Draw logo on the left; adjust header Y positions accordingly
        doc.addImage(logoImg, "PNG", 14, 10, 30, 30); // x, y, width, height
      } catch (err) {
        console.warn("Logo not found or failed to load. Skipping logo.");
      }
    }

    // Business name (centered)
    doc.setFontSize(18);
    doc.text(settings?.businessName || "My Business", pageWidth / 2, 20, { align: "center" });

    // Business address (centered, optional)
    if (settings?.businessAddress) {
      doc.setFontSize(11);
      doc.text(settings.businessAddress, pageWidth / 2, 28, { align: "center" });
    }

    // Sub-header: Invoice label and metadata
    doc.setFontSize(16);
    doc.text("INVOICE", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Invoice: ${invoiceId}`, 14, 55);
    doc.text(`Date: ${saleDate}`, 14, 62);
    if (sale.user?.name) {
      doc.text(`Sold by: ${sale.user.name}`, pageWidth - 14, 55, { align: "right" });
    }

    // ===== CUSTOMER INFO =====
    let y = 70;
    if (sale.customerName || sale.customerEmail || sale.customerPhone) {
      if (sale.customerName) {
        doc.text(`Customer: ${sale.customerName}`, 14, y);
        y += 6;
      }
      if (sale.customerEmail) {
        doc.text(`Email: ${sale.customerEmail}`, 14, y);
        y += 6;
      }
      if (sale.customerPhone) {
        doc.text(`Phone: ${sale.customerPhone}`, 14, y);
        y += 6;
      }
    }

    // ===== TABLE =====
    const tableBody = itemsArr.map((item) => {
      const baseName = item.product?.name || "Unknown Product";
      const variantLabel =
        item.variants && item.variants.length > 0
          ? ` (${item.variants.map((v) => v.option).join(", ")})`
          : "";
      const displayName = `${baseName}${variantLabel}`;

      const qty = item.quantity ?? 0;
      const unit =
        typeof item.priceAtSale === "number" ? item.priceAtSale : item.product?.price ?? 0;
      const subtotal = unit * qty;

      return [
        displayName,
        qty,
        `P${unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `P${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ];
    });

    autoTable(doc, {
      head: [["Product", "Qty", "Unit Price", "Total"]],
      body: tableBody,
      startY: y + 4,
      styles: { halign: "center" },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // ===== TOTAL =====
    const computedTotal =
      typeof sale.totalAmount === "number"
        ? sale.totalAmount
        : itemsArr.reduce(
            (sum, i) => sum + (i.priceAtSale ?? i.product?.price ?? 0) * (i.quantity ?? 0),
            0
          );

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90;
    doc.setFontSize(14);
    doc.text(
      `Grand Total: P${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageWidth - 14,
      finalY,
      { align: "right" }
    );

    // ===== FOOTER =====
    doc.setFontSize(10);
    const footerText = settings?.pdfSettings?.footerText || "Thank you for your purchase!";
    doc.text(footerText, pageWidth / 2, finalY + 18, { align: "center" });

    // ===== OUTPUT =====
    const invoiceDateForName = new Date(sale.date || sale.createdAt || Date.now())
      .toISOString()
      .slice(0, 10);
    const fileName = `Invoice_${invoiceId}_${invoiceDateForName}.pdf`;

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Simple viewer page so tab title and download name are nice
    const escapeHtml = (str = "") =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const safeFileName = escapeHtml(fileName);

    const viewerHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${safeFileName}</title>
  <style>
    html,body { height:100%; margin:0; }
    .toolbar { position:fixed; top:0; left:0; right:0; height:44px; display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:8px; background:#f3f4f6; box-sizing:border-box; z-index:1000; }
    .toolbar a { text-decoration:none; padding:6px 10px; border-radius:6px; background:#2563eb; color:white; font-weight:600; }
    iframe { position:fixed; top:44px; left:0; right:0; bottom:0; width:100%; height:calc(100% - 44px); border:none; }
  </style>
</head>
<body>
  <div class="toolbar">
    <a id="download" href="${pdfUrl}" download="${safeFileName}">Download</a>
  </div>
  <iframe src="${pdfUrl}"></iframe>
</body>
</html>`;

    const viewerBlob = new Blob([viewerHtml], { type: "text/html" });
    const viewerUrl = URL.createObjectURL(viewerBlob);
    window.open(viewerUrl, "_blank");

    // Cleanup object URLs later
    setTimeout(() => {
      try {
        URL.revokeObjectURL(pdfUrl);
        URL.revokeObjectURL(viewerUrl);
      } catch (e) {}
    }, 15000);
  } catch (err) {
    console.error("Error generating invoice:", err);
    alert("Failed to generate invoice PDF. Check console for details.");
  }
};

// Helper: fetch image as data URL, throw if not found
async function loadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image not found at ${url}`);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
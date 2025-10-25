import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { API_URL } from "../config";

export const generatePDF = async ({ type = "invoice", data }) => {
  try {
    if (!data) throw new Error("No data provided.");

    // Fetch settings
    let settings = {};
    try {
      const token = localStorage.getItem("token");
      const { data: res } = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      settings = res || {};
    } catch (err) {
      console.warn("Failed to fetch settings:", err?.message || err);
    }

    // Create doc
    const doc = new jsPDF({
      orientation: settings?.pdfSettings?.orientation || "portrait",
      unit: "mm",
      format: (settings?.pdfSettings?.pageSize || "A4").toLowerCase(),
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Normalize data
    let normalized = {};
    if (type === "invoice") {
      normalized = {
        title: "INVOICE",
        id: data.invoiceNumber || data._id,
        date: data.date || data.createdAt,
        user: data.user?.name,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
        },
        items: data.items.map((item) => ({
          name: item.product?.name || "Unknown Product",
          variant: item.variants?.map(v => v.option).join(", "),
          qty: item.quantity,
          unit: item.priceAtSale ?? item.product?.price ?? 0,
        })),
        total: data.totalAmount,
      };
    } else if (type === "po") {
      normalized = {
        title: "PURCHASE ORDER",
        id: data.poNumber || data._id,
        date: data.createdAt,
        user: data.createdBy?.name,
        customer: {
          name: data.supplier?.name,
          email: data.supplier?.email,
          phone: data.supplier?.phone,
        },
        items: data.items.map((item) => ({
          name: item.product?.name || item.productName || "Unknown",
          variant: item.variant || "—",
          qty: item.quantity,
          unit: item.unitCost,
        })),
        total: data.totalAmount,
        notes: data.notes,
        status: data.status,
      };
    } else {
      throw new Error(`Unsupported PDF type: ${type}`);
    }

    // ===== HEADER =====
    if (settings?.businessLogoUrl) {
      try {
        const logoImg = await loadImage(settings.businessLogoUrl);
        doc.addImage(logoImg, "PNG", 14, 10, 30, 30);
      } catch (err) {
        console.warn("Logo not found or failed to load. Skipping logo.");
      }
    }

    doc.setFontSize(18);
    doc.text(settings?.businessName || "My Business", pageWidth / 2, 20, { align: "center" });

    if (settings?.businessAddress) {
      doc.setFontSize(11);
      doc.text(settings.businessAddress, pageWidth / 2, 28, { align: "center" });
    }

    doc.setFontSize(16);
    doc.text(normalized.title, pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(12);
    doc.text(`${normalized.title} #: ${normalized.id}`, 14, 55);
    doc.text(`Date: ${new Date(normalized.date).toLocaleString()}`, 14, 62);
    if (normalized.user) {
      doc.text(`Handled by: ${normalized.user}`, pageWidth - 14, 55, { align: "right" });
    }

    // ===== CUSTOMER INFO =====
    let y = 70;
    const c = normalized.customer;
    if (c?.name || c?.email || c?.phone) {
      if (c.name) {
        doc.text(`Supplier: ${c.name}`, 14, y); y += 6;
      }
      if (c.email) {
        doc.text(`Email: ${c.email}`, 14, y); y += 6;
      }
      if (c.phone) {
        doc.text(`Phone: ${c.phone}`, 14, y); y += 6;
      }
    }

    // ===== TABLE =====
    const tableBody = normalized.items.map((item) => [
      item.name,
      item.variant || "—",
      item.qty,
      `P${item.unit.toFixed(2)}`,
      `P${(item.unit * item.qty).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [["Product", "Variant", "Qty", "Unit Price", "Subtotal"]],
      body: tableBody,
      startY: y + 4,
      styles: { halign: "center" },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // ===== TOTAL =====
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90;
    doc.setFontSize(14);
    doc.text(
      `Grand Total: P${normalized.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageWidth - 14,
      finalY,
      { align: "right" }
    );

    // ===== PO Notes and Status =====
    if (type === "po") {
      doc.setFontSize(11);
      if (normalized.status) {
        doc.text(`Status: ${normalized.status}`, 14, finalY);
      }
      if (normalized.notes) {
        doc.text(`Notes: ${normalized.notes}`, 14, finalY + 6);
      }
    }

    // ===== FOOTER =====
    doc.setFontSize(10);
    const footerText = settings?.pdfSettings?.footerText || "Thank you!";
    doc.text(footerText, pageWidth / 2, finalY + 18, { align: "center" });

    // ===== OUTPUT =====
    const fileName = `${normalized.title.replace(" ", "_")}_${normalized.id}_${new Date(normalized.date).toISOString().slice(0, 10)}.pdf`;
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

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

    setTimeout(() => {
      try {
        URL.revokeObjectURL(pdfUrl);
        URL.revokeObjectURL(viewerUrl);
      } catch (e) {}
    }, 15000);
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Failed to generate PDF. Check console for details.");
  }
};

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
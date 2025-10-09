// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate invoice PDF and open in a new tab.
 * Named export so both AddSale and SalesTable can import: `import { generatePDF } from "..."`
 */
export const generatePDF = (sale) => {
  try {
    if (!sale) throw new Error("No sale data provided.");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Prefer backend-saved invoice number; fallback to id / temp token
    const invoiceId =
      sale.invoiceNumber ||
      sale._id ||
      `TEMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const saleDate = new Date(sale.date || sale.createdAt || Date.now()).toLocaleString();
    const itemsArr = Array.isArray(sale.items) ? sale.items : [];

    // Header
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Invoice: ${invoiceId}`, 14, 32);
    doc.text(`Date: ${saleDate}`, 14, 40);

    if (sale.user?.name) {
      doc.text(`Sold by: ${sale.user.name}`, pageWidth - 14, 32, { align: "right" });
    }

    // Customer info (if any)
    if (sale.customerName || sale.customerEmail || sale.customerPhone) {
      let y = 48;
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
      }
    }

    // Build table body
    const tableBody = itemsArr.map((item) => {
      const name = item.product?.name || "Unknown Product";
      const qty = item.quantity ?? 0;
      const unit =
        typeof item.priceAtSale === "number" ? item.priceAtSale : item.product?.price ?? 0;
      const subtotal = unit * qty;
      return [
        name,
        qty,
        `P${unit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `P${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ];
    });

    // Insert table
    autoTable(doc, {
      head: [["Product", "Qty", "Unit Price", "Total"]],
      body: tableBody,
      startY: 70,
      styles: { halign: "center" },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Totals
    const computedTotal =
      typeof sale.totalAmount === "number"
        ? sale.totalAmount
        : itemsArr.reduce((sum, i) => sum + (i.priceAtSale ?? i.product?.price ?? 0) * (i.quantity ?? 0), 0);

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90;
    doc.setFontSize(14);
    doc.text(
      `Grand Total: P${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageWidth - 14,
      finalY,
      { align: "right" }
    );

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your purchase!", pageWidth / 2, finalY + 18, { align: "center" });

    // Open in new tab (use blob URL so it's not auto-downloaded)
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  } catch (err) {
    console.error("Error generating invoice:", err);
    // keep UX friendly and non-breaking
    // (you can remove alert if you'd rather just log)
    alert("Failed to generate invoice PDF. Check console for details.");
  }
};

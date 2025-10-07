import { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const InvoiceModal = ({ sale, isOpen, onClose }) => {
  const pdfRef = useRef();

  if (!sale) return null;

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Invoice", 14, 20);

    // Basic info
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${sale._id}`, 14, 30);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`, 14, 37);
    doc.text(`Customer: ${sale.customerName || "N/A"}`, 14, 44);
    doc.text(`Handled by: ${sale.staffName || "N/A"}`, 14, 51);

    // Table of items
    const items = sale.items.map((item) => [
      item.productName,
      item.quantity,
      `₱${item.price.toFixed(2)}`,
      `₱${(item.price * item.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 60,
      head: [["Product", "Qty", "Price", "Subtotal"]],
      body: items
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: ₱${sale.totalAmount.toFixed(2)}`, 14, finalY);

    doc.save(`invoice-${sale._id}.pdf`);
  };

  return (
    <div
      className={`modal modal-bottom sm:modal-middle ${
        isOpen ? "modal-open" : ""
      }`}
    >
      <div className="modal-box w-11/12 max-w-2xl" ref={pdfRef}>
        <h2 className="text-2xl font-bold mb-4 text-center">Invoice</h2>

        <div className="text-sm mb-2">
          <p><strong>Invoice ID:</strong> {sale._id}</p>
          <p><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}</p>
          <p><strong>Customer:</strong> {sale.customerName || "N/A"}</p>
          <p><strong>Handled by:</strong> {sale.staffName || "N/A"}</p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="table table-sm w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>₱{item.price.toFixed(2)}</td>
                  <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right font-semibold text-lg">
          Total: ₱{sale.totalAmount.toFixed(2)}
        </div>

        <div className="modal-action">
          <button className="btn btn-outline" onClick={downloadPDF}>
            Download PDF
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

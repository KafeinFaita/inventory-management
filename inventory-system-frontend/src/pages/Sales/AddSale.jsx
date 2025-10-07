// src/pages/Sales/AddSale.jsx
import { useState, useEffect } from "react";
import { API_URL } from "../../config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


const generateInvoiceId = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*1000)}`;
};

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1, search: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSale, setRecentSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // 🔁 Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addItem = () => setItems([...items, { product: "", quantity: 1, search: "" }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p._id === item.product);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  };

  // ✅ Prevent overselling
  const validateQuantities = () => {
    for (const item of items) {
      const product = products.find((p) => p._id === item.product);
      if (!product) continue;
      if (item.quantity > product.stock) {
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      validateQuantities();

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");

      setRecentSale(data);
      setShowInvoiceModal(true);
      setMessage("✅ Sale recorded successfully!");
      setItems([{ product: "", quantity: 1, search: "" }]);
      fetchProducts(); // Refresh stock
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🧾 Generate PDF Invoice
const generatePDF = (sale) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const invoiceId = generateInvoiceId();

    // 🧾 Validate and normalize data
    if (!sale) throw new Error("No sale data provided.");
    const saleId = sale._id || "N/A";
    const saleDate = sale.createdAt
      ? new Date(sale.createdAt).toLocaleString()
      : new Date().toLocaleString();
    const staffName = sale.user?.name || "Unknown Staff";
    const items = Array.isArray(sale.items) ? sale.items : [];

    // ---- HEADER ----
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    
    doc.text(`Invoice: ${invoiceId}`, 14, 20);
    doc.text(`Date: ${saleDate}`, 14, 42);

    // ---- STAFF INFO ----
    doc.text("Processed by:", 14, 55);
    doc.text(staffName, 45, 55);

    // ---- TABLE ----
    const tableData = items.map((item) => {
      const productName = item.product?.name || "Unknown Product";
      const quantity = item.quantity ?? 0;
      const unitPrice = typeof item.priceAtSale === "number" ? item.priceAtSale : 0;
      const total = unitPrice * quantity;

      return [
        productName,
        quantity,
        `P${unitPrice.toFixed(2)}`,
        `P${total.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [["Product", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { halign: "center" },
    });

    // ---- TOTAL ----
    const totalAmount =
      typeof sale.totalAmount === "number"
        ? sale.totalAmount
        : items.reduce((sum, i) => sum + (i.priceAtSale || 0) * (i.quantity || 0), 0);

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Grand Total: P${totalAmount.toFixed(2)}`, pageWidth - 14, finalY, {
      align: "right",
    });

    // ---- FOOTER ----
    doc.setFontSize(10);
    doc.text("Thank you for your purchase!", pageWidth / 2, finalY + 20, {
      align: "center",
    });

    // ---- SAVE ----
    window.open(doc.output("bloburl"), "_blank");
  } catch (error) {
    console.error("Error generating invoice:", error);
  }
};


  // 🌀 Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  // ⚠️ Error + Retry
  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <div className="flex items-center justify-between w-full">
          <span>{error}</span>
          <button className="btn btn-sm btn-primary ml-4" onClick={fetchProducts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Add Sale</h1>

      {message && (
        <div
          className={`text-center font-semibold ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-4 rounded-lg shadow">
        {items.map((item, index) => {
          const filteredProducts = products.filter((p) =>
            p.name.toLowerCase().includes(item.search.toLowerCase())
          );
          const selectedProduct = products.find((p) => p._id === item.product);

          return (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block font-semibold mb-1">Product</label>
                <input
                  type="text"
                  placeholder="Search product..."
                  value={item.search}
                  onChange={(e) => handleChange(index, "search", e.target.value)}
                  className="input input-bordered w-full mb-1"
                />
                <select
                  value={item.product}
                  onChange={(e) => handleChange(index, "product", e.target.value)}
                  required
                  className="select select-bordered w-full"
                >
                  <option value="">Select Product</option>
                  {filteredProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₱{p.price} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-1 text-sm text-gray-600">
                    Price: ₱{selectedProduct.price}, Stock: {selectedProduct.stock}, Brand:{" "}
                    {selectedProduct.brand || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.stock : undefined}
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (selectedProduct && val > selectedProduct.stock) {
                      alert(`Only ${selectedProduct.stock} in stock for ${selectedProduct.name}`);
                      return;
                    }
                    handleChange(index, "quantity", val);
                  }}
                  required
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end md:justify-start">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn btn-error btn-sm mt-6"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addItem}
          className="btn btn-outline btn-primary"
          disabled={isSubmitting}
        >
          + Add Another Item
        </button>

        <div className="text-right font-semibold text-lg mt-4">
          Total: ₱{calculateTotal().toLocaleString()}
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full mt-4 ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Recording Sale..." : "Record Sale"}
        </button>
      </form>

      {/* 🧾 Invoice Modal */}
      {showInvoiceModal && recentSale && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-2">Invoice Generated</h3>
            <p className="mb-4">Sale ID: {recentSale._id}</p>
            <div className="overflow-x-auto mb-4">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSale.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product?.name || "Unknown"}</td>
                      <td>{item.quantity}</td>
                      <td>₱{item.product?.price || 0}</td>
                      <td>₱{(item.quantity * (item.product?.price || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right font-semibold text-lg mb-4">
              Total: ₱
              {recentSale.items
                .reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0)
                .toLocaleString()}
            </div>
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => generatePDF(recentSale)}
              >
                Download PDF
              </button>
              <button
                className="btn"
                onClick={() => setShowInvoiceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

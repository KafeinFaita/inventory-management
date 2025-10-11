// src/pages/Sales/AddSale.jsx
import { useState, useEffect } from "react";
import { API_URL } from "../../config";
import { generatePDF } from "../../utils/generatePDF";

const generateInvoiceId = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(
    Math.random() * 1000
  )}`;
};

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    { product: "", quantity: 1, search: "", variants: [] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSale, setRecentSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Fetch products
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

  const addItem = () =>
    setItems([...items, { product: "", quantity: 1, search: "", variants: [] }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Update variant selection
  const handleVariantChange = (itemIndex, variantCategory, option) => {
    const updated = [...items];
    const item = updated[itemIndex];
    item.variants = item.variants || [];
    const existing = item.variants.find((v) => v.category === variantCategory);
    if (existing) existing.option = option;
    else item.variants.push({ category: variantCategory, option });
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p._id === item.product);
      if (!prod) return sum;
      if (prod.hasVariants && item.variants?.length > 0) {
        // get matching variant price
        const variantName = item.variants.map((v) => v.option).join(" - ");
        const variant = prod.variants.find((v) => v.name === variantName);
        return sum + (variant?.price || prod.price) * item.quantity;
      }
      return sum + prod.price * item.quantity;
    }, 0);
  };

  // Validate quantities against stock
  const validateQuantities = () => {
    for (const item of items) {
      const product = products.find((p) => p._id === item.product);
      if (!product) continue;

      if (product.hasVariants && item.variants?.length > 0) {
        const variantName = item.variants.map((v) => v.option).join(" - ");
        const variant = product.variants.find((v) => v.name === variantName);
        if (!variant) throw new Error(`Variant not found for ${product.name}`);
        if (item.quantity > variant.stock)
          throw new Error(
            `Not enough stock for ${product.name} (${variant.name}). Available: ${variant.stock}`
          );
      } else {
        if (item.quantity > product.stock)
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`
          );
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
      setItems([{ product: "", quantity: 1, search: "", variants: [] }]);
      fetchProducts(); // refresh stock
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="ml-3 text-lg text-gray-600">Loading products...</span>
      </div>
    );

  if (error)
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

                {selectedProduct?.hasVariants && selectedProduct.variants.length > 0 && (
                  <div className="mt-2">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.name} className="mb-1">
                        <label className="text-sm font-semibold">{v.name}</label>
                        <select
  value={item.variants?.find((x) => x.category === v.name)?.option || ""}
  onChange={(e) => handleVariantChange(index, v.name, e.target.value)}
  required
  className="select select-bordered w-full"
>
  <option value="">Select option</option>
  <option value={v.name}>{v.name} — Stock: {v.stock}</option>
</select>

                      </div>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="mt-1 text-sm text-gray-600">
                    Price: ₱{selectedProduct.price}, Stock: {selectedProduct.stock},{" "}
                    Brand: {selectedProduct.brand || "N/A"}
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

      {/* Invoice modal code stays the same */}
    </div>
  );
}

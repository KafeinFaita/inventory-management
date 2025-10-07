import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1, search: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

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

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
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

      setMessage("✅ Sale recorded successfully!");
      setItems([{ product: "", quantity: 1, search: "" }]);

      // Refresh product list to reflect updated stock
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 Loading state for product fetch
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  // ❌ Error state (with retry)
  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-xl mx-auto mt-10">
        <div className="flex justify-between items-center w-full">
          <span>{error}</span>
          <button className="btn btn-sm btn-primary" onClick={fetchProducts}>
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
          className={`alert shadow-md ${
            message.startsWith("✅")
              ? "alert-success"
              : message.startsWith("❌")
              ? "alert-error"
              : "alert-info"
          }`}
        >
          <span>{message}</span>
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
              {/* Product search + select */}
              <div>
                <label className="block font-semibold mb-1">Product</label>
                <input
                  type="text"
                  placeholder="Search product..."
                  value={item.search}
                  onChange={(e) => handleChange(index, "search", e.target.value)}
                  className="input input-bordered w-full mb-1"
                  disabled={isSubmitting}
                />
                <select
                  value={item.product}
                  onChange={(e) => handleChange(index, "product", e.target.value)}
                  required
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
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

              {/* Quantity */}
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleChange(index, "quantity", parseInt(e.target.value))}
                  required
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Remove button */}
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
    </div>
  );
}

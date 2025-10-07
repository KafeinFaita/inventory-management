import { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1, search: "" }]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response from server");

        if (data.length === 0) {
          setAlert({ type: "info", message: "No products available yet." });
        }

        setProducts(data);
      } catch (err) {
        console.error(err);
        setAlert({ type: "error", message: err.message });
      } finally {
        setIsFetching(false);
      }
    };

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
    setAlert({ type: "", message: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in again.");

      const res = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record sale");
      }

      // Success
      setAlert({ type: "success", message: "Sale recorded successfully!" });

      // Update local stock immediately
      const updatedProducts = [...products];
      items.forEach((item) => {
        const prod = updatedProducts.find((p) => p._id === item.product);
        if (prod) prod.stock -= item.quantity;
      });
      setProducts(updatedProducts);

      // Reset form
      setItems([{ product: "", quantity: 1, search: "" }]);
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 Loading spinner for page load
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Add Sale</h1>

      {/* 🧾 Alerts */}
      {alert.message && (
        <div
          className={`alert ${
            alert.type === "error"
              ? "alert-error"
              : alert.type === "success"
              ? "alert-success"
              : "alert-info"
          } shadow-md`}
        >
          <span>{alert.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-4 rounded-lg shadow">
        {items.map((item, index) => {
          const filteredProducts = products.filter(
            (p) =>
              p.name.toLowerCase().includes(item.search.toLowerCase()) && p.stock > 0
          );
          const selectedProduct = products.find((p) => p._id === item.product);

          return (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Product Search */}
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
                    Price: ₱{selectedProduct.price} | Stock: {selectedProduct.stock}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.stock : 1}
                  value={item.quantity}
                  onChange={(e) =>
                    handleChange(
                      index,
                      "quantity",
                      Math.min(parseInt(e.target.value), selectedProduct?.stock || 1)
                    )
                  }
                  required
                  className="input input-bordered w-full"
                  disabled={!selectedProduct}
                />
              </div>

              {/* Remove Item */}
              <div className="flex justify-end md:justify-start">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn btn-error btn-sm mt-6"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button type="button" onClick={addItem} className="btn btn-outline btn-primary">
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

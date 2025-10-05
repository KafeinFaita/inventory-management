// src/pages/Sales/SaleForm.jsx
import { useState, useEffect } from "react";

export default function SaleForm({ onSuccess }) {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = () => setItems([...items, { product: "", quantity: 1 }]);
  const handleRemoveItem = (index) =>
    setItems(items.filter((_, i) => i !== index));

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error("Failed to record sale");

      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert("Error recording sale.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-6 rounded-lg shadow">
      {items.map((item, index) => (
        <div key={index} className="flex flex-wrap items-center gap-4">
          <select
            className="select select-bordered w-full md:w-1/2"
            value={item.product}
            onChange={(e) => handleChange(index, "product", e.target.value)}
            required
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="input input-bordered w-24"
            min="1"
            value={item.quantity}
            onChange={(e) => handleChange(index, "quantity", e.target.value)}
            required
          />
          {items.length > 1 && (
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={() => handleRemoveItem(index)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
        + Add Item
      </button>
      <div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Sale"}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect } from "react";

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch available products from backend
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

  // Add another item field
  const addItem = () => setItems([...items, { product: "", quantity: 1 }]);

  // Remove an item
  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Handle product or quantity changes
  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculate total amount
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p._id === item.product);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  };

  // Submit sale to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");

      setMessage("✅ Sale recorded successfully!");
      setItems([{ product: "", quantity: 1 }]);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Add Sale</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-base-200 p-4 rounded-lg shadow"
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            {/* Product selector */}
            <div>
              <label className="block font-semibold mb-1">Product</label>
              <select
                value={item.product}
                onChange={(e) =>
                  handleChange(index, "product", e.target.value)
                }
                required
                className="select select-bordered w-full"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₱{p.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleChange(index, "quantity", parseInt(e.target.value))
                }
                required
                className="input input-bordered w-full"
              />
            </div>

            {/* Remove item button */}
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
        ))}

        {/* Add Item Button */}
        <button
          type="button"
          onClick={addItem}
          className="btn btn-outline btn-primary"
        >
          + Add Another Item
        </button>

        {/* Total */}
        <div className="text-right font-semibold text-lg mt-4">
          Total: ₱{calculateTotal().toLocaleString()}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`btn btn-primary w-full mt-4 ${
            isSubmitting ? "loading" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Recording Sale..." : "Record Sale"}
        </button>

        {message && (
          <div
            className={`text-center mt-3 font-semibold ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

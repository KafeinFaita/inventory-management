import { useState, useEffect } from "react";

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: "", quantity: 1, search: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found, please login");

        const res = await fetch("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMessage("❌ " + err.message);
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
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please login");

      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }), // backend assigns user automatically
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");

      setMessage("✅ Sale recorded successfully!");
      setItems([{ product: "", quantity: 1, search: "" }]);
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {/* Searchable product input */}
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
                    Price: ₱{selectedProduct.price}, Stock: {selectedProduct.stock}, Brand: {selectedProduct.brand || "N/A"}
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
                />
              </div>

              {/* Remove button */}
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

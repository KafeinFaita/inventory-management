import { useState, useEffect } from "react";

const AddSaleForm = () => {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [message, setMessage] = useState("");

  // Fetch product list for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products"); // adjust if your backend URL differs
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!productId || !quantity || !totalPrice) {
      setMessage("⚠️ Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, totalPrice }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Sale added successfully!");
        setQuantity("");
        setTotalPrice("");
      } else {
        setMessage(`❌ ${data.error || "Failed to add sale"}`);
      }
    } catch (err) {
      console.error("Error adding sale:", err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-3">Add New Sale (Temporary)</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <select
            className="w-full border rounded p-2"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Total Price (₱)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            step="0.01"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Add Sale
        </button>

        {message && <p className="mt-2 text-sm">{message}</p>}
      </form>
    </div>
  );
};

export default AddSaleForm;

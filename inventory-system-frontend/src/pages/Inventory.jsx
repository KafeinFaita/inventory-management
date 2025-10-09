import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

// ✅ Axios instance with token header
const token = localStorage.getItem("token");
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { Authorization: `Bearer ${token}` },
});

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true); // initial fetch
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // {type: 'success'|'error', text: ''}

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // fetch all data concurrently
      await Promise.allSettled([fetchProducts(), fetchBrands(), fetchCategories()]);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load inventory data." });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch products." });
      throw err;
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/brands");
      setBrands(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch brands." });
      throw err;
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch categories." });
      throw err;
    }
  };

  // Success message auto-fade
  const showSuccess = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // ✅ Frontend validation
    if (!name.trim() || !brand || !category || price < 0 || stock < 0) {
      setMessage({ type: "error", text: "Please fill in all fields correctly." });
      setSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, { name, brand, category, stock, price });
        showSuccess("Product updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/products", { name, brand, category, stock, price });
        showSuccess("Product added successfully!");
      }

      // reset form
      setName("");
      setBrand("");
      setCategory("");
      setStock(0);
      setPrice(0);

      fetchProducts();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to save product. Please try again.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setStock(product.stock);
    setPrice(product.price);
    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      showSuccess("Product deleted successfully!");
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to delete product.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setBrand("");
    setCategory("");
    setStock(0);
    setPrice(0);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Inventory</h1>

      {/* Messages */}
      {message && message.type === "error" && (
        <div className="alert alert-error shadow-lg flex justify-between items-center mb-4">
          <span>{message.text}</span>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              setMessage(null);
              fetchAllData();
            }}
          >
            Retry
          </button>
        </div>
      )}
      {message && message.type === "success" && (
        <div className="alert alert-success shadow-lg mb-4 transition-opacity duration-500">
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      <form className="space-y-4 bg-base-200 p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Product" : "Add Product"}</h2>

        <div>
          <label className="block font-semibold mb-1">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Brand</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="select select-bordered w-full"
            required
            disabled={submitting}
          >
            <option value="">Select a brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select select-bordered w-full"
            required
            disabled={submitting}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Stock</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="input input-bordered w-full"
            min="0"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input input-bordered w-full"
            min="0"
            step="0.01"
            required
            disabled={submitting}
          />
        </div>

        <div className="space-x-2">
          <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`}>
            {editingId ? "Update Product" : "Add Product"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="btn btn-ghost" disabled={submitting}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Product Table / Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-200 p-6 rounded-lg shadow">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className={p.stock <= 5 ? "bg-red-100" : ""}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{p.category}</td>
                  <td>
                    {p.stock} {p.stock <= 5 && <span className="text-red-600 font-bold">⚠️ Low</span>}
                  </td>
                  <td>{p.price}</td>
                  <td className="space-x-2">
                    <button className="btn btn-sm btn-info" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

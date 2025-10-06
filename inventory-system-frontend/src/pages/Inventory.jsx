import { useEffect, useState } from "react";
import axios from "axios";

// ✅ Create Axios instance with token header
const token = localStorage.getItem("token");
const api = axios.create({
  baseURL: "http://localhost:5000/api",
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

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/brands");
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          name,
          brand,
          category,
          stock,
          price,
        });
        setEditingId(null);
        showMessage("Product updated successfully!");
      } else {
        await api.post("/products", {
          name,
          brand,
          category,
          stock,
          price,
        });
        showMessage("Product added successfully!");
      }

      setName("");
      setBrand("");
      setCategory("");
      setStock(0);
      setPrice(0);
      fetchProducts();
    } catch (err) {
      console.error(err);
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
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      showMessage("Product deleted successfully!");
    } catch (err) {
      console.error(err);
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

      {successMessage && (
        <div className="alert alert-success shadow-lg mb-4">
          <div>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Product" : "Add Product"}
        </h2>

        <div>
          <label className="block font-semibold mb-1">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Brand</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select a brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
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
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
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
          />
        </div>

        <div className="space-x-2">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Product" : "Add Product"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="btn btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Product Table */}
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
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingBrand, setEditingBrand] = useState(null);

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/brands", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBrands(res.data);
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await axios.put(
          `http://localhost:5000/api/brands/${editingBrand._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditingBrand(null);
      } else {
        await axios.post("http://localhost:5000/api/brands", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({ name: "" });
      fetchBrands();
    } catch (err) {
      console.error("Error saving brand:", err);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/brands/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBrands();
    } catch (err) {
      console.error("Error deleting brand:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Brands</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 p-4 bg-base-200 rounded-lg">
        <input
          type="text"
          placeholder="Brand Name"
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          className="input input-bordered w-full"
          required
        />
        <button type="submit" className="btn btn-primary">
          {editingBrand ? "Update Brand" : "Add Brand"}
        </button>
        {editingBrand && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setEditingBrand(null);
              setForm({ name: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Table */}
      <table className="table w-full">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b._id}>
              <td>{b.name}</td>
              <td className="space-x-2">
                <button className="btn btn-sm btn-info" onClick={() => handleEdit(b)}>Edit</button>
                <button className="btn btn-sm btn-error" onClick={() => handleDelete(b._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

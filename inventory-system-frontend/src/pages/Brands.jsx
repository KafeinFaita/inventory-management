import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingBrand, setEditingBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // For success/error messages

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.get(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBrands(res.data);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setMessage({ type: "error", text: "Failed to load brands. Try refreshing." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBrand) {
        await axios.put(`${API_URL}/api/brands/${editingBrand._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ type: "success", text: "Brand updated successfully." });
        setEditingBrand(null);
      } else {
        await axios.post(`${API_URL}/api/brands`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ type: "success", text: "Brand added successfully." });
      }
      setForm({ name: "" });
      fetchBrands();
    } catch (err) {
      console.error("Error saving brand:", err);
      setMessage({ type: "error", text: "Failed to save brand. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      await axios.delete(`${API_URL}/api/brands/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: "Brand deleted successfully." });
      fetchBrands();
    } catch (err) {
      console.error("Error deleting brand:", err);
      setMessage({ type: "error", text: "Failed to delete brand." });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Brands</h1>

      {/* Messages / Error Alerts */}
      {message && message.type === "error" && (
        <div className="alert alert-error shadow-lg flex justify-between items-center mb-4">
          <span>{message.text}</span>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              setMessage(null);
              fetchBrands();
            }}
          >
            Retry
          </button>
        </div>
      )}
      {message && message.type === "success" && (
        <div className="alert alert-success shadow-lg mb-4">
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 p-4 bg-base-200 rounded-lg">
        <input
          type="text"
          placeholder="Brand Name"
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          className="input input-bordered w-full"
          required
          disabled={submitting}
        />
        <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`}>
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
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Table / Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <table className="table w-full">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b._id} className={editingBrand?._id === b._id ? "bg-base-300" : ""}>
                <td>{b.name}</td>
                <td className="space-x-2">
                  <button className="btn btn-sm btn-info" onClick={() => handleEdit(b)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(b._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

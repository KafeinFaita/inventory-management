import { useState, useEffect } from "react";
import axios from "axios";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get("http://localhost:5000/api/categories");
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCategory) {
      await axios.put(`http://localhost:5000/api/categories/${editingCategory._id}`, form);
      setEditingCategory(null);
    } else {
      await axios.post("http://localhost:5000/api/categories", form);
    }
    setForm({ name: "" });
    fetchCategories();
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await axios.delete(`http://localhost:5000/api/categories/${id}`);
    fetchCategories();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 p-4 bg-base-200 rounded-lg">
        <input
          type="text"
          placeholder="Category Name"
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          className="input input-bordered w-full"
          required
        />
        <button type="submit" className="btn btn-primary">
          {editingCategory ? "Update Category" : "Add Category"}
        </button>
        {editingCategory && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setEditingCategory(null);
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
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td className="space-x-2">
                <button className="btn btn-sm btn-info" onClick={() => handleEdit(c)}>Edit</button>
                <button className="btn btn-sm btn-error" onClick={() => handleDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

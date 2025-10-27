// pages/Categories.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { DataTableProvider } from "../contexts/DataTableContext";
import DataTable from "../components/DataTable";
import Alert from "../components/Alert";
import Form from "../components/Form";

export default function Categories() {
  // --- State ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // server-side table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");

  // form state
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);

  const messageRef = useRef(null);

  // --- API setup ---
  const getApi = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: `${API_URL}/api`,
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // --- Helpers for alerts ---
  const showSuccess = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => setMessage(null), 3000);
  };

  const showError = (text) => {
    setMessage({ type: "error", text });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- Fetch categories ---
  useEffect(() => {
    fetchCategories();
  }, [page, pageSize, search, sortField, sortOrder]);

  const fetchCategories = async () => {
    setLoading(true);
    const api = getApi();
    try {
      const res = await api.get("/categories", {
        params: {
          page,
          limit: pageSize,
          search,
          sort: sortField,
          order: sortOrder,
        },
      });

      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized = raw.map((c) => ({
        _id: c._id,
        name: c.name ?? "",
        description: c.description ?? "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      setCategories(normalized);
      setTotalPages(
        typeof res.data?.totalPages === "number" ? res.data.totalPages : 1
      );
    } catch (err) {
      showError("Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD handlers ---
  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormValues({ name: category.name, description: category.description });
    setFormError(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setLoading(true);
    try {
      const api = getApi();
      await api.delete(`/categories/${id}`);
      fetchCategories();
      showSuccess("Category deleted successfully!");
    } catch (err) {
      const backendMsg =
        err.response?.data?.error || "Failed to delete category.";
      showError(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const api = getApi();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formValues);
        showSuccess("Category updated successfully!");
      } else {
        await api.post("/categories", formValues);
        showSuccess("Category added successfully!");
      }
      fetchCategories();
      handleCancel();
    } catch (err) {
      const backendMsg =
        err.response?.data?.error || "Failed to save category.";
      setFormError(backendMsg); // show inside modal
      showError(backendMsg);    // also show global alert
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormValues({ name: "", description: "" });
    setShowForm(false);
    setFormError(null);
  };

  // --- Form fields config ---
  const fields = [
    { type: "text", name: "name", label: "Category Name", required: true },
    { type: "textarea", name: "description", label: "Description" },
  ];

  // --- Render ---
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categories</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormValues({ name: "", description: "" });
            setFormError(null);
            setShowForm(true);
          }}
        >
          + Add Category
        </button>
      </div>

      <Alert
        message={message}
        onRetry={fetchCategories}
        clearMessage={() => setMessage(null)}
      />

      <Form
        show={showForm}
        title={editingId ? "Edit Category" : "Add Category"}
        fields={fields}
        values={formValues}
        setValues={setFormValues}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        error={formError}
        clearError={() => setFormError(null)}
      />

      <DataTableProvider
        value={{
          data: categories,
          loading,
          page,
          setPage,
          pageSize,
          setPageSize,
          totalPages,
          sortField,
          sortOrder,
          setSort: (field) => {
            if (sortField === field) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortField(field);
              setSortOrder("asc");
            }
          },
          search,
          setSearch,
          filters: {}, // no extra filters for categories
          setFilters: () => {},
        }}
      >
        <DataTable
          columns={[
            { field: "name", label: "Name" },
            { field: "description", label: "Description" },
            { field: "createdAt", label: "Created At", type: "date" },
            { field: "updatedAt", label: "Updated At", type: "date" },
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </DataTableProvider>
    </div>
  );
}
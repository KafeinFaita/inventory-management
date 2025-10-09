import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";

export default function EditUser() {
  const { id } = useParams(); // user ID from URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // {type: 'success'|'error', text: ''}

  const fetchUser = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error("Failed to fetch user.");
      }
      const data = await res.json();
      setFormData({
        name: data.name,
        email: data.email,
        role: data.role,
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to load user." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showSuccess = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Frontend validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage({ type: "error", text: "Name and email cannot be empty." });
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update user.");
      }
      showSuccess("User updated successfully!");
      setTimeout(() => navigate("/users"), 1000); // navigate after 1s so user sees message
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-md">
      <h1 className="text-3xl md:text-4xl font-bold">Edit User</h1>

      {message && message.type === "error" && (
        <div className="alert alert-error shadow-lg flex justify-between items-center mb-4">
          <span>{message.text}</span>
          <button className="btn btn-sm btn-primary" onClick={fetchUser}>
            Retry
          </button>
        </div>
      )}

      {message && message.type === "success" && (
        <div className="alert alert-success shadow-lg mb-4 transition-opacity duration-500">
          {message.text}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="select select-bordered w-full"
            disabled={submitting}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <button type="submit" className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}>
          Save
        </button>
      </form>
    </div>
  );
}

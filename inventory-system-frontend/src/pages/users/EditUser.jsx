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
  const [error, setError] = useState(null);

  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user.");
        return res.json();
      })
      .then((data) => {
        setFormData({
          name: data.name,
          email: data.email,
          role: data.role,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update user.");
        return res.json();
      })
      .then(() => {
        navigate("/users"); // back to users page
      })
      .catch((err) => setError(err.message));
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full">
      <h1 className="text-3xl md:text-4xl font-bold">Edit User</h1>
      <form className="space-y-4 max-w-md" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="input input-bordered w-full"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="input input-bordered w-full"
          required
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="select select-bordered w-full"
        >
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        <button type="submit" className="btn btn-primary w-full">
          Save
        </button>
      </form>
    </div>
  );
}

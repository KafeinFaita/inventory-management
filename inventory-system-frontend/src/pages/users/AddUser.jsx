import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  const [loading, setLoading] = useState(true); // for admin check
  const [submitting, setSubmitting] = useState(false); // for form submit
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || data.role !== "admin") {
          navigate("/"); // redirect non-admins
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    fetchMe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic frontend validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("All fields are required.");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add user.");
      } else {
        setSuccess("User added successfully!");
        setFormData({ name: "", email: "", password: "", role: "staff" });
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
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
    <div className="p-4 md:p-6 space-y-6 w-full max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold">Add User</h1>

      {error && (
        <div className="alert alert-error shadow-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-primary" onClick={() => setError("")}>
            X
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success shadow-lg mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button className="btn btn-sm btn-primary" onClick={() => setSuccess("")}>
            X
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-6 rounded-lg shadow">
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

        <div className="relative">
          <label className="block font-semibold mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input input-bordered w-full pr-12"
            required
            disabled={submitting}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
          </button>
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

        <button
          type="submit"
          className={`btn btn-primary w-full mt-4 ${submitting ? "loading" : ""}`}
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
}

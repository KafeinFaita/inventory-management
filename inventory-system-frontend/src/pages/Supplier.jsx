import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const messageRef = useRef(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const getApi = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: `${API_URL}/api`,
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const scrollToMessage = () => {
    setTimeout(() => {
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const api = getApi();
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch suppliers." });
      scrollToMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const api = getApi();
    const payload = { name, company, contactPerson, phone, email, address, notes };

    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
        setMessage({ type: "success", text: "Supplier updated successfully!" });
      } else {
        await api.post("/suppliers", payload);
        setMessage({ type: "success", text: "Supplier added successfully!" });
      }
      scrollToMessage();

      // reset form
      setEditingId(null);
      setName("");
      setCompany("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");

      fetchSuppliers();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to save supplier.";
      setMessage({ type: "error", text: backendMsg });
      scrollToMessage();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setName(supplier.name);
    setCompany(supplier.company || "");
    setContactPerson(supplier.contactPerson || "");
    setPhone(supplier.phone || "");
    setEmail(supplier.email || "");
    setAddress(supplier.address || "");
    setNotes(supplier.notes || "");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    setSubmitting(true);
    try {
      const api = getApi();
      await api.delete(`/suppliers/${id}`);
      setMessage({ type: "success", text: "Supplier deleted successfully!" });
      scrollToMessage();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to delete supplier.";
      setMessage({ type: "error", text: backendMsg });
      scrollToMessage();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setCompany("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Suppliers</h1>

      {message && (
        <div ref={messageRef}>
          {message.type === "error" && (
            <div className="alert alert-error shadow-lg flex justify-between items-center mb-4">
              <span>{message.text}</span>
              <button className="btn btn-sm btn-primary" onClick={() => { setMessage(null); fetchSuppliers(); }}>Retry</button>
            </div>
          )}
          {message.type === "success" && (
            <div className="alert alert-success shadow-lg mb-4 transition-opacity duration-500">{message.text}</div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      <form className="space-y-4 bg-base-200 p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Supplier" : "Add Supplier"}</h2>

        <div>
          <label className="block font-semibold mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
                 className="input input-bordered w-full" required disabled={submitting} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Company</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                 className="input input-bordered w-full" disabled={submitting} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Contact Person</label>
          <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                 className="input input-bordered w-full" disabled={submitting} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                   className="input input-bordered w-full" disabled={submitting} />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                   className="input input-bordered w-full" disabled={submitting} />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Address</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)}
                    className="textarea textarea-bordered w-full" disabled={submitting} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    className="textarea textarea-bordered w-full" disabled={submitting} />
        </div>

        <div className="space-x-2 mt-4">
          <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`}>
            {editingId ? "Update Supplier" : "Add Supplier"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={submitting}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Suppliers Table */}
      <div className="overflow-x-auto bg-base-200 p-6 rounded-lg shadow mt-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner text-primary loading-lg"></span>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.company}</td>
                  <td>{s.contactPerson}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.address}</td>
                  <td>{s.notes}</td>
                  <td className="space-x-2">
                    <button className="btn btn-sm btn-info" onClick={() => handleEdit(s)}></button>
                                        <button className="btn btn-sm btn-info" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">No suppliers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function Settings() {
  const [settings, setSettings] = useState({
    businessName: "",
    businessLogoUrl: "",
    businessAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const token = localStorage.getItem("token");
  const apiHeaders = { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`, { headers: apiHeaders });
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings({
          businessName: data.businessName || "",
          businessLogoUrl: data.businessLogoUrl || "",
          businessAddress: data.businessAddress || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error updating settings");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-xl">
      <h1 className="text-3xl md:text-4xl font-bold">App Settings</h1>

      {successMessage && (
        <div className="alert alert-success shadow-lg">
          <div>{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-base-200 p-6 rounded-lg shadow">
        <div>
          <label className="block font-semibold mb-1">Business Name</label>
          <input
            type="text"
            name="businessName"
            value={settings.businessName}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Business Logo URL</label>
          <input
            type="url"
            name="businessLogoUrl"
            value={settings.businessLogoUrl}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Business Address</label>
          <input
            type="text"
            name="businessAddress"
            value={settings.businessAddress}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>


        <div>
          <button type="submit" className="btn btn-primary w-full mt-4">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

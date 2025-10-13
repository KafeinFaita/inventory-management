// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function Settings() {
  const [settings, setSettings] = useState({
    businessName: "",
    businessLogoUrl: "",
    businessAddress: "",
    pdfFooterText: "",
    pdfPageSize: "A4",
    pdfOrientation: "portrait",
  });
  const [availableLogos, setAvailableLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const apiHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Fetch settings + available logos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, logosRes] = await Promise.all([
          fetch(`${API_URL}/api/settings`, { headers: apiHeaders }),
          fetch(`${API_URL}/api/settings/logos`, { headers: apiHeaders }),
        ]);

        if (!settingsRes.ok) throw new Error("Failed to fetch settings");
        const data = await settingsRes.json();
        setSettings({
          businessName: data.businessName || "",
          businessLogoUrl: data.businessLogoUrl || "",
          businessAddress: data.businessAddress || "",
          pdfFooterText: data.pdfSettings?.footerText || "",
          pdfPageSize: data.pdfSettings?.pageSize || "A4",
          pdfOrientation: data.pdfSettings?.orientation || "portrait",
        });

        if (logosRes.ok) {
          const logos = await logosRes.json();
          setAvailableLogos(logos);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        businessName: settings.businessName,
        businessLogoUrl: settings.businessLogoUrl,
        businessAddress: settings.businessAddress,
        pdfSettings: {
          footerText: settings.pdfFooterText,
          pageSize: settings.pdfPageSize,
          orientation: settings.pdfOrientation,
        },
      };

      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error updating settings");
    }
  };

  // Upload new logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`${API_URL}/api/settings/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload logo");

      setSettings((prev) => ({ ...prev, businessLogoUrl: data.logoUrl }));
      setSuccessMessage("Logo uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Logo upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete current logo
  const handleDeleteLogo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/logo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete logo");
      setSettings((prev) => ({ ...prev, businessLogoUrl: "" }));
      setSuccessMessage("Logo deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Logo deletion failed");
    }
  };

  // Reuse existing logo
  const handleReuseLogo = async (logoUrl) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify({ ...settings, businessLogoUrl: logoUrl }),
      });
      if (!res.ok) throw new Error("Failed to reuse logo");
      setSettings((prev) => ({ ...prev, businessLogoUrl: logoUrl }));
      setSuccessMessage("Logo updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reuse logo");
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-base-200 p-6 rounded-lg shadow">
        {/* Business Details Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Business Details</h2>

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
            <label className="block font-semibold mb-1">Business Address</label>
            <input
              type="text"
              name="businessAddress"
              value={settings.businessAddress}
              onChange={handleChange}
              className="input input-bordered w-full"
            />
          </div>

          {/* Logo Management */}
          <div>
            <label className="block font-semibold mb-1">Business Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="file-input file-input-bordered w-full"
              disabled={uploading}
            />
            {settings.businessLogoUrl && (
              <div className="mt-2 space-y-2">
                <img
                  src={settings.businessLogoUrl}
                  alt="Business Logo"
                  className="h-16 object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="btn btn-error btn-sm"
                >
                  Delete Logo
                </button>
              </div>
            )}
          </div>

          {/* Reuse existing logos */}
          {availableLogos.length > 0 && (
            <div>
              <label className="block font-semibold mb-1">Reuse Existing Logo</label>
              <select
                className="select select-bordered w-full"
                onChange={(e) => handleReuseLogo(e.target.value)}
                value=""
              >
                <option value="">-- Select a logo --</option>
                {availableLogos.map((url) => (
                  <option key={url} value={url}>
                    {url.split("/").pop()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* PDF Settings Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">PDF Settings</h2>

                    <div>
            <label className="block font-semibold mb-1">Invoice Footer Text</label>
            <input
              type="text"
              name="pdfFooterText"
              value={settings.pdfFooterText}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="e.g. Thank you for your business!"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Page Size</label>
            <select
              name="pdfPageSize"
              value={settings.pdfPageSize}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Orientation</label>
            <select
              name="pdfOrientation"
              value={settings.pdfOrientation}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
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
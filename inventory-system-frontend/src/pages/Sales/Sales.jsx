// src/pages/Sales/Sales.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SalesTable from "../../components/SalesTable";
import { API_URL } from "../../config";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You are not logged in.");

      const res = await fetch(`${API_URL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error(`Failed to fetch sales data (${res.status})`);
      }

      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load sales data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-error shadow-lg m-4 flex justify-between items-center">
        <span>{error}</span>
        <button className="btn btn-sm btn-primary" onClick={fetchSales}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold">Sales Report</h1>
        <Link to="add" className="btn btn-primary">
          + New Sale
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No sales recorded yet.</p>
      ) : (
        // ✅ Make table container scrollable on small screens
        <div className="overflow-x-auto">
          <SalesTable sales={sales} />
        </div>
      )}
    </div>
  );
}

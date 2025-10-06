// src/pages/Sales/Sales.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SalesTable from "../../components/SalesTable";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
useEffect(() => {
  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token"); // get JWT token
      const res = await fetch("http://localhost:5000/api/sales", {
        headers: {
          Authorization: `Bearer ${token}`, // pass token in headers
        },
      });
      if (!res.ok) throw new Error("Failed to fetch sales data");
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load sales data.");
    } finally {
      setLoading(false);
    }
  };

  fetchSales();
}, []);

  if (loading)
    return <p className="p-4 text-center text-lg">Loading sales data...</p>;

  if (error)
    return (
      <p className="p-4 text-center text-red-600 font-semibold">{error}</p>
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold">Sales Report</h1>
        <Link
          to="add"
          className="btn btn-primary"
        >
          + New Sale
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No sales recorded yet.</p>
      ) : (
        <SalesTable sales={sales} />
      )}
    </div>
  );
}

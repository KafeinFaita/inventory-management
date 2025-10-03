import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-base-200 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Total Products</h2>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>

        <div className="p-4 bg-base-200 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Total Brands</h2>
          <p className="text-3xl font-bold">{stats.totalBrands}</p>
        </div>

        <div className="p-4 bg-base-200 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Total Categories</h2>
          <p className="text-3xl font-bold">{stats.totalCategories}</p>
        </div>
      </div>

      {/* Low-stock alerts */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Low Stock Alerts</h2>
        {stats.lowStockProducts.length === 0 ? (
          <p className="text-green-600">All products are sufficiently stocked ✅</p>
        ) : (
          <ul className="space-y-2">
            {stats.lowStockProducts.map((product) => (
              <li
                key={product._id}
                className="p-2 bg-red-100 rounded flex justify-between items-center"
              >
                <span>{product.name}</span>
                <span className="font-bold text-red-600">{product.stock}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

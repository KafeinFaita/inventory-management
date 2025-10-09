// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaBoxes, FaTags, FaLayerGroup, FaDollarSign, FaShoppingCart } from "react-icons/fa";
import { API_URL } from "../config";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
    monthlySales: [],
    latestSales: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in.");

        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Dashboard API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        setStats({
          ...data,
          lowStockProducts: data.lowStockProducts || [],
          latestSales: data.latestSales || [],
          topProducts: data.topProducts || [],
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartData = (() => {
    const sales = stats.monthlySales || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const start = window.innerWidth < 768 ? Math.max(0, currentMonth - 2) : Math.max(0, currentMonth - 3);
    return sales.slice(start, currentMonth + 1);
  })();

  const totalRevenue = (stats.monthlySales || []).reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const totalItemsSold = (stats.monthlySales || []).reduce((sum, m) => sum + (m.itemsSold || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <span>{error}</span>
          <button
            className="btn btn-sm btn-primary ml-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full min-w-0 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-0">
        {[ 
          { icon: FaBoxes, label: "Total Products", value: stats.totalProducts, color: "text-primary" },
          { icon: FaTags, label: "Total Brands", value: stats.totalBrands, color: "text-secondary" },
          { icon: FaLayerGroup, label: "Total Categories", value: stats.totalCategories, color: "text-accent" },
          { icon: FaShoppingCart, label: "Total Items Sold", value: totalItemsSold, color: "text-yellow-500" },
          { icon: FaDollarSign, label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, color: "text-green-600" },
        ].map((card, idx) => (
          <div
            key={idx}
            className="card bg-base-200 shadow-md p-4 flex flex-col items-center justify-center text-center w-full min-w-0"
          >
            <card.icon className={`text-3xl ${card.color} mb-2`} />
            <div>
              <p className="text-sm md:text-base font-semibold">{card.label}</p>
              <p className="text-xl md:text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}

        {/* Low Stock Alerts */}
        <div className="card bg-base-200 shadow-md p-4 w-full min-w-0">
          <p className="text-sm md:text-base font-semibold">Low Stock Alerts</p>
          {stats.lowStockProducts?.length === 0 ? (
            <p className="text-green-600 font-bold mt-2">All stocked ✅</p>
          ) : (
            <ul className="mt-2 space-y-1 text-red-600">
              {stats.lowStockProducts.map((p) => (
                <li key={p._id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-bold">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Monthly Sales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData || []} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="itemsSold" fill="#8884d8" name="Items Sold" />
            <Bar yAxisId="right" dataKey="totalRevenue" fill="#82ca9d" name="Revenue (₱)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latest Sales Table */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Latest Sales</h2>
        <table className="table table-zebra table-compact w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Items</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {stats.latestSales?.length > 0 ? (
              stats.latestSales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.date ? new Date(sale.date).toLocaleDateString() : "N/A"}</td>
                  <td>{sale.user?.name || "N/A"}</td>
                  <td className="flex flex-wrap items-start gap-1">
  {sale.items?.map((item) => (
    <span
      key={item.product?._id}
      className="badge badge-sm badge-primary break-words max-w-[120px] truncate"
    >
      {item.product?.name || "N/A"} x{item.quantity || 0}
    </span>
  ))}
</td>


                  <td className="font-semibold text-success">₱{sale.totalAmount?.toLocaleString() || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center">No sales found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Products Table */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Top Selling Products</h2>
        <table className="table table-zebra table-compact w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Total Sold</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts?.length > 0 ? (
              stats.topProducts.map((p) => (
                <tr key={p._id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-warning">₱{p.price?.toLocaleString() || 0}</td>
                  <td>
                    <span className="badge badge-sm badge-success">{p.totalSold || 0}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">No product data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


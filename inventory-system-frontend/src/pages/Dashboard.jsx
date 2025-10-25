import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaBoxes,
  FaTags,
  FaLayerGroup,
  FaDollarSign,
  FaShoppingCart,
  FaExclamationTriangle,
} from "react-icons/fa";
import { API_URL } from "../config";
import { generatePDF } from "../utils/generatePDF";

function KPIValue({ label, value }) {
  return (
    <div className="flex flex-col">
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-lg md:text-xl font-bold whitespace-nowrap">
        {value}
      </p>
    </div>
  );
}
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
    monthlySales: [],
    latestSales: [],
    topProducts: [],
    staffStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthsToShow, setMonthsToShow] = useState(3);

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
          staffStats: data.staffStats || [],
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

  const chartData = stats.monthlySales.slice(-monthsToShow);
  const totalRevenue = stats.monthlySales.reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const totalItemsSold = stats.monthlySales.reduce((sum, m) => sum + (m.itemsSold || 0), 0);

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
          <button className="btn btn-sm btn-primary ml-4" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 w-full min-w-0">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <button className="btn btn-sm btn-outline">Export PDF</button>
        </div>
      </div>

      {/* KPI Cards */}
      {/* KPI Cards */}
      <div className="flex flex-wrap gap-6">
        {[
          { icon: FaBoxes, label: "Products", value: stats.totalProducts, color: "from-blue-500 to-blue-600" },
          { icon: FaTags, label: "Brands", value: stats.totalBrands, color: "from-purple-500 to-purple-600" },
          { icon: FaLayerGroup, label: "Categories", value: stats.totalCategories, color: "from-pink-500 to-pink-600" },
          { icon: FaShoppingCart, label: "Items Sold", value: totalItemsSold, color: "from-yellow-400 to-yellow-500" },
          { icon: FaDollarSign, label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, color: "from-green-500 to-green-600" },
        ].map((card, idx) => (
          <div
      key={idx}
      className={`card shadow-md p-5 text-white bg-gradient-to-r ${card.color} rounded-xl flex-1 min-w-[250px]`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-full flex-shrink-0">
          <card.icon className="text-2xl" />
        </div>
        <KPIValue label={card.label} value={card.value} />
      </div>
    </div>

        ))}
      </div>

      {/* Charts */}
      <div className="card bg-base-100 shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#82ca9d"
              tickFormatter={(val) => `₱${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="itemsSold" fill="#3b82f6" name="Items Sold" />
            <Line yAxisId="right" type="monotone" dataKey="totalRevenue" stroke="#22c55e" name="Revenue (₱)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latest Sales */}
      <div className="card bg-base-100 shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Latest Sales</h2>
        <table className="table table-compact w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Items</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.latestSales.length > 0 ? (
              stats.latestSales.map((sale) => (
                <tr key={sale._id} className="hover">
                  <td>{sale.date ? new Date(sale.date).toLocaleString() : "N/A"}</td>
                  <td>{sale.user?.name || "N/A"}</td>
                  <td className="flex flex-wrap gap-1">
                    {sale.items.map((item, idx) => {
                      const variantLabel = item.variants?.length
                        ? ` (${item.variants.map((v) => v.option).join(", ")})`
                        : "";
                      const fullText = `${item.product?.name || "N/A"}${variantLabel} × ${item.quantity || 0}`;
                      return (
                        <span
                          key={idx}
                          className="badge badge-sm badge-primary whitespace-nowrap"
                          title={fullText}
                        >
                          {fullText}
                        </span>
                      );
                    })}
                  </td>
                  <td className="font-semibold text-success">
                    ₱{sale.totalAmount?.toLocaleString() || 0}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline btn-primary"
                      onClick={() => generatePDF({ type: "invoice", data: sale })}
                    >
                      Invoice
                    </button>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                                <td colSpan={5} className="text-center">No sales found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Products */}
      <div className="card bg-base-100 shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Top Products</h2>
        <table className="table table-compact w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Total Sold</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((p) => (
                <tr key={p._id} className="hover">
                  <td className="font-medium">{p.name}</td>
                  <td className="text-warning">
                    ₱{p.price?.toLocaleString() || 0}
                  </td>
                  <td>
                    <span className="badge badge-sm badge-success">
                      {p.totalSold || 0}
                    </span>
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

      {/* Staff Performance */}
      <div className="card bg-base-100 shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Staff Performance</h2>
        <table className="table table-compact w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Staff</th>
              <th>Total Sales</th>
              <th>Items Sold</th>
              <th>Total Revenue</th>
              <th>Avg Sale Value</th>
            </tr>
          </thead>
          <tbody>
            {stats.staffStats.length > 0 ? (
              stats.staffStats.map((s) => (
                <tr key={s.staffId} className="hover">
                  <td className="font-medium">{s.staffName}</td>
                  <td>{s.totalSales}</td>
                  <td>{s.totalItemsSold}</td>
                  <td className="text-success font-semibold">
                    ₱{(s.totalRevenue || 0).toLocaleString()}
                  </td>
                  <td>
                    ₱{(s.avgSaleValue || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">No staff data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Low Stock Alerts */}
      <div className="card bg-base-100 shadow-md p-6">
        <h2 className="text-xl font-semibold text-error mb-4 flex items-center gap-2">
          <FaExclamationTriangle /> Low Stock Alerts
        </h2>
        {stats.lowStockProducts.length > 0 ? (
          <ul className="space-y-2">
            {stats.lowStockProducts.map((p) => (
              <li
                key={`${p._id}-${p.variant || "base"}`}
                className="flex justify-between border-b border-base-200 pb-1"
              >
                <span>
                  {p.name}
                  {p.variant ? ` (${p.variant})` : ""}
                </span>
                <span className="font-bold text-error">{p.stock}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base-content">No low stock items 🎉</p>
        )}
      </div>
    </div>
  );
}
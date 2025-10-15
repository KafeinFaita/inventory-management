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
import {
  FaBoxes,
  FaTags,
  FaLayerGroup,
  FaDollarSign,
  FaShoppingCart,
} from "react-icons/fa";
import { API_URL } from "../config";
import { generatePDF } from "../utils/generatePDF";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
    monthlySales: [],
    latestSales: [],
    topProducts: [],
    staffStats: [], // 👈 added
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
          staffStats: data.staffStats || [], // 👈 added
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
    return sales.slice(-monthsToShow);
  })();

  const totalRevenue = (stats.monthlySales || []).reduce(
    (sum, m) => sum + (m.totalRevenue || 0),
    0
  );
  const totalItemsSold = (stats.monthlySales || []).reduce(
    (sum, m) => sum + (m.itemsSold || 0),
    0
  );

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
          {
            icon: FaBoxes,
            label: "Total Products",
            value: stats.totalProducts,
            color: "text-primary",
          },
          {
            icon: FaTags,
            label: "Total Brands",
            value: stats.totalBrands,
            color: "text-secondary",
          },
          {
            icon: FaLayerGroup,
            label: "Total Categories",
            value: stats.totalCategories,
            color: "text-accent",
          },
          {
            icon: FaShoppingCart,
            label: "Total Items Sold",
            value: totalItemsSold,
            color: "text-yellow-500",
          },
          {
            icon: FaDollarSign,
            label: "Total Revenue",
            value: `₱${totalRevenue.toLocaleString()}`,
            color: "text-green-600",
          },
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Low Stock Alerts</h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-500">No low stock items 🎉</p>
          ) : (
            <ul className="mt-2 space-y-1 text-red-600">
              {stats.lowStockProducts.map((p) => (
                <li key={`${p._id}-${p.variant || "base"}`} className="flex justify-between">
                  <span>
                    {p.name}
                    {p.variant ? ` (${p.variant})` : ""}
                  </span>
                  <span className="font-bold">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">Monthly Sales</h2>
          <select
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData || []}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#82ca9d"
              tickFormatter={(val) =>
                `₱${val.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              }
            />
            <Tooltip
              formatter={(val, name) =>
                name === "Revenue (₱)"
                  ? `₱${val.toLocaleString()}`
                  : val.toLocaleString()
              }
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="itemsSold"
              fill="#8884d8"
              name="Items Sold"
            />
            <Bar
              yAxisId="right"
              dataKey="totalRevenue"
              fill="#82ca9d"
              name="Revenue (₱)"
            />
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.latestSales?.length > 0 ? (
              stats.latestSales.map((sale) => (
                <tr key={sale._id}>
                  <td>
                    {sale.date
                      ? new Date(sale.date).toLocaleString()
                      : "N/A"}
                  </td>
                  <td>{sale.user?.name || "N/A"}</td>
                  <td className="flex flex-wrap items-start gap-1">
                    {sale.items?.map((item, idx) => {
                      const variantLabel =
                        item.variants && item.variants.length > 0
                          ? ` (${item.variants.map((v) => v.option).join(", ")})`
                          : "";
                      return (
                        <span
                          key={`${item.product?._id || idx}`}
                          className="badge badge-sm badge-primary tooltip cursor-help border-b border-dotted whitespace-normal break-words"
                          data-tip={`${item.product?.name || "N/A"}${variantLabel} × ${item.quantity || 0}`}
                        >
                          <span className="truncate max-w-[160px] inline-block align-middle">
                            {item.product?.name || "N/A"}{variantLabel} × {item.quantity || 0}
                          </span>
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
                      onClick={() => generatePDF(sale)}
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No sales found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Products Table */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          Top Selling Products
        </h2>
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
                <td colSpan={3} className="text-center">
                  No product data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Performance Table */}
      <div className="p-4 bg-base-200 rounded-lg shadow w-full min-w-0 overflow-x-auto">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Staff Performance</h2>
        <table className="table table-zebra table-compact w-full">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Total Sales</th>
              <th>Items Sold</th>
              <th>Total Revenue</th>
              <th>Avg Sale Value</th>
            </tr>
          </thead>
          <tbody>
            {stats.staffStats?.length > 0 ? (
              stats.staffStats.map((s) => (
                <tr key={s.staffId}>
                  <td className="font-medium">{s.staffName}</td>
                  <td>{s.totalSales}</td>
                  <td>{s.totalItemsSold}</td>
                  <td className="text-success font-semibold">
                    ₱{(s.totalRevenue || 0).toLocaleString()}
                  </td>
                  <td>
                    ₱{(s.avgSaleValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No staff data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
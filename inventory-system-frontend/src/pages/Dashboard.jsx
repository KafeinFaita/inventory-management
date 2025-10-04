import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaBoxes, FaTags, FaLayerGroup } from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
    monthlySales: [
      { month: "Jan", itemsSold: 50, totalRevenue: 25000 },
      { month: "Feb", itemsSold: 30, totalRevenue: 18000 },
      { month: "Mar", itemsSold: 40, totalRevenue: 22000 },
      { month: "Apr", itemsSold: 20, totalRevenue: 12000 },
    ],
  });

  const [chartData, setChartData] = useState(stats.monthlySales);

  useEffect(() => {
    // fetchStats(); // will replace mock data with DB later

    const handleResize = () => {
      if (window.innerWidth < 768) {
        // mobile: show only last 3 months
        setChartData(stats.monthlySales.slice(-3));
      } else {
        setChartData(stats.monthlySales);
      }
    };

    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [stats.monthlySales]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-base-200 rounded-lg shadow flex items-center space-x-4">
          <FaBoxes className="text-3xl text-primary" />
          <div>
            <p className="text-sm md:text-base font-semibold">Total Products</p>
            <p className="text-xl md:text-2xl font-bold">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="p-4 bg-base-200 rounded-lg shadow flex items-center space-x-4">
          <FaTags className="text-3xl text-secondary" />
          <div>
            <p className="text-sm md:text-base font-semibold">Total Brands</p>
            <p className="text-xl md:text-2xl font-bold">{stats.totalBrands}</p>
          </div>
        </div>
        <div className="p-4 bg-base-200 rounded-lg shadow flex items-center space-x-4">
          <FaLayerGroup className="text-3xl text-accent" />
          <div>
            <p className="text-sm md:text-base font-semibold">Total Categories</p>
            <p className="text-xl md:text-2xl font-bold">{stats.totalCategories}</p>
          </div>
        </div>
        <div className="p-4 bg-base-200 rounded-lg shadow">
          <p className="text-sm md:text-base font-semibold">Low Stock Alerts</p>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-green-600 font-bold">All stocked ✅</p>
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
      <div className="p-4 bg-base-200 rounded-lg shadow">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Monthly Sales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
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
    </div>
  );
}

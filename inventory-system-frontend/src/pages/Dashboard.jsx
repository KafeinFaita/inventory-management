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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    lowStockProducts: [],
    monthlySales: [],
  });

  const [chartData, setChartData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found, please login");

        const res = await fetch("http://localhost:5000/api/dashboard", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Error fetching dashboard data:", data.error);
          return;
        }

        const safeData = {
          ...data,
          lowStockProducts: data.lowStockProducts || [],
          monthlySales: data.monthlySales || [],
        };

        setStats(safeData);

        // Calculate totals from monthlySales
        const revenue = safeData.monthlySales.reduce(
          (sum, m) => sum + (m.totalRevenue || 0),
          0
        );
        const itemsSold = safeData.monthlySales.reduce(
          (sum, m) => sum + (m.itemsSold || 0),
          0
        );

        setTotalRevenue(revenue);
        setTotalItemsSold(itemsSold);

        // Initial chart data (slice for mobile if needed)
        setChartData(
          window.innerWidth < 768
            ? safeData.monthlySales.slice(-3)
            : safeData.monthlySales
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchStats();

    // Handle window resize for chart slicing
    const handleResize = () => {
      setChartData((prev) => {
        if (!stats.monthlySales) return [];
        return window.innerWidth < 768
          ? stats.monthlySales.slice(-3)
          : stats.monthlySales;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Removed stats.monthlySales dependency to avoid retrigger loops

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
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

        <div className="p-4 bg-base-200 rounded-lg shadow flex items-center space-x-4">
          <FaShoppingCart className="text-3xl text-yellow-500" />
          <div>
            <p className="text-sm md:text-base font-semibold">Total Items Sold</p>
            <p className="text-xl md:text-2xl font-bold">{totalItemsSold}</p>
          </div>
        </div>

        <div className="p-4 bg-base-200 rounded-lg shadow flex items-center space-x-4">
          <FaDollarSign className="text-3xl text-green-600" />
          <div>
            <p className="text-sm md:text-base font-semibold">Total Revenue</p>
            <p className="text-xl md:text-2xl font-bold">₱{totalRevenue.toLocaleString()}</p>
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
    </div>
  );
}

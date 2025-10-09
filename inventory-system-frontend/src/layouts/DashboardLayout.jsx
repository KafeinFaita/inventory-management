import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import {
  FaTachometerAlt,
  FaBoxes,
  FaTags,
  FaLayerGroup,
  FaDollarSign,
  FaCog,
  FaUser,
  FaSignOutAlt,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../config";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme toggle state
  const [darkMode, setDarkMode] = useState(false);

  // Get role from token
  const token = localStorage.getItem("token");
  let role = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      role = payload.role;
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }

  // Fetch theme from backend on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const themeFromDb = res.data.themeMode || "light";
        setDarkMode(themeFromDb === "dark");
        document.documentElement.setAttribute(
          "data-theme",
          themeFromDb === "dark" ? "dark" : "light"
        );
      } catch (err) {
        console.error("Failed to fetch theme:", err);
      }
    };
    fetchTheme();
  }, []);

  const toggleInventory = () => setInventoryOpen(!inventoryOpen);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setSidebarOpen(false);
  };

  const handleThemeToggle = async () => {
    try {
      const newTheme = !darkMode ? "dark" : "light";
      setDarkMode(!darkMode);
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      if (token) {
        await axios.put(
          `${API_URL}/api/settings`,
          { themeMode: newTheme },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (err) {
      console.error("Failed to update theme:", err);
    }
  };

  const linkClass = (path) =>
    location.pathname === path
      ? "flex items-center space-x-3 p-2 rounded-lg bg-primary text-primary-content font-semibold transition-colors duration-200"
      : "flex items-center space-x-3 p-2 rounded-lg hover:bg-primary hover:text-primary-content transition-colors duration-200";

  return (
    <div className="flex min-h-screen font-sans overflow-x-hidden bg-base-100 text-base-content">
      {/* Mobile Hamburger */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button onClick={toggleSidebar} className="btn btn-square btn-ghost">
          <HiMenu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-base-200 p-6 w-64 md:relative fixed md:static top-0 left-0 h-screen md:h-auto z-40 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 flex-shrink-0 shadow-lg`}
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-center tracking-wide mb-4">
            Inventory System
          </h1>

          {/* Dark/Light Mode Toggle */}
          <div className="flex items-center justify-center w-full mb-6">
            <button
              onClick={handleThemeToggle}
              className="relative w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center px-1 transition-colors duration-300"
            >
              <span
                className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${
                  darkMode ? "translate-x-8" : "translate-x-0"
                }`}
              >
                {darkMode ? (
                  <FaMoon className="text-blue-600 text-sm" />
                ) : (
                  <FaSun className="text-yellow-400 text-sm" />
                )}
              </span>
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {/* Dashboard */}
          <li>
            <Link
              to="/"
              className={linkClass("/")}
              onClick={() => setSidebarOpen(false)}
            >
              <FaTachometerAlt /> <span>Dashboard</span>
            </Link>
          </li>

          {/* Inventory Section (admin only) */}
          {role === "admin" && (
            <li>
              <button
                className="flex items-center space-x-3 p-2 w-full rounded-lg hover:bg-primary hover:text-primary-content transition-colors duration-200"
                onClick={toggleInventory}
              >
                <FaBoxes /> <span>Inventory</span>
              </button>
              {inventoryOpen && (
                <ul className="pl-6 mt-1 space-y-1">
                  <li>
                    <Link
                      to="/inventory"
                      className={linkClass("/inventory")}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <FaBoxes /> <span>Products</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/inventory/brands"
                      className={linkClass("/inventory/brands")}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <FaTags /> <span>Brands</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/inventory/categories"
                      className={linkClass("/inventory/categories")}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <FaLayerGroup /> <span>Categories</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {/* Sales */}
          <li>
            <Link
              to="/sales"
              className={linkClass("/sales")}
              onClick={() => setSidebarOpen(false)}
            >
              <FaDollarSign /> <span>Sales</span>
            </Link>
          </li>

          {/* Users (admin only) */}
          {role === "admin" && (
            <li>
              <Link
                to="/users"
                className={linkClass("/users")}
                onClick={() => setSidebarOpen(false)}
              >
                <FaUser /> <span>Users</span>
              </Link>
            </li>
          )}

          {/* Settings (admin only) */}
          {role === "admin" && (
            <li>
              <Link
                to="/settings"
                className={linkClass("/settings")}
                onClick={() => setSidebarOpen(false)}
              >
                <FaCog /> <span>Settings</span>
              </Link>
            </li>
          )}

          {/* Profile & Logout */}
          <li className="mt-6 pt-4 border-t border-base-content/20">
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary hover:text-primary-content transition-colors duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <FaUser /> <span>Profile</span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-error hover:text-error-content transition-colors duration-200"
            >
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from "react";
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
} from "react-icons/fa";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get role from token
  const token = localStorage.getItem("token");
  let role = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      role = payload.role; // "admin" or "staff"
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }

  const toggleInventory = () => setInventoryOpen(!inventoryOpen);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setSidebarOpen(false);
  };

  const linkClass = (path) =>
    location.pathname === path
      ? "flex items-center space-x-3 p-2 rounded-lg bg-primary text-white font-semibold transition-colors duration-200"
      : "flex items-center space-x-3 p-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200";

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Mobile Hamburger */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button onClick={toggleSidebar} className="btn btn-square btn-ghost">
          <HiMenu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-gradient-to-b from-gray-800 to-gray-900 p-6 w-64 md:relative fixed md:static top-0 left-0 h-screen md:h-auto z-40 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 flex-shrink-0 text-gray-200 shadow-lg`}
      >
        <h1 className="text-2xl font-bold mb-8 text-center text-white tracking-wide">
          Inventory System
        </h1>

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
                className="flex items-center space-x-3 p-2 w-full rounded-lg hover:bg-primary hover:text-white transition-colors duration-200"
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

          {/* Sales (all users) */}
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
          <li className="mt-6 pt-4 border-t border-gray-700">
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <FaUser /> <span>Profile</span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200"
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
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

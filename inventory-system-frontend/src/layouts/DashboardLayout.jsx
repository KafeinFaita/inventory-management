import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { HiMenu } from "react-icons/hi";

export default function DashboardLayout() {
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleInventory = () => setInventoryOpen(!inventoryOpen);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen bg-base-100">
      {/* Mobile Hamburger */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button onClick={toggleSidebar} className="btn btn-square btn-ghost">
          <HiMenu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-base-200 p-4 w-64 md:relative fixed md:static top-0 left-0 h-screen md:h-auto z-40 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 flex-shrink-0`}
      >

        <h1 className="text-2xl font-bold mb-6">Inventory System</h1>

        <ul className="menu bg-base-200 w-full rounded-box">
          <li>
            <Link
              to="/"
              className={
                location.pathname === "/" ? "active font-bold text-primary" : ""
              }
              onClick={() => setSidebarOpen(false)}
            >
              Dashboard
            </Link>
          </li>

          <li tabIndex={0}>
            <button className="w-full text-left" onClick={toggleInventory}>
              Inventory
            </button>
            {inventoryOpen && (
              <ul className="p-2">
                <li>
                  <Link
                    to="/inventory"
                    className={location.pathname === "/inventory" ? "active" : ""}
                    onClick={() => setSidebarOpen(false)}
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/inventory/brands"
                    className={location.pathname === "/inventory/brands" ? "active" : ""}
                    onClick={() => setSidebarOpen(false)}
                  >
                    Brands
                  </Link>
                </li>
                <li>
                  <Link
                    to="/inventory/categories"
                    className={location.pathname === "/inventory/categories" ? "active" : ""}
                    onClick={() => setSidebarOpen(false)}
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              to="/sales"
              className={location.pathname === "/sales" ? "active" : ""}
              onClick={() => setSidebarOpen(false)}
            >
              Sales
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={location.pathname === "/settings" ? "active" : ""}
              onClick={() => setSidebarOpen(false)}
            >
              Settings
            </Link>
          </li>
        </ul>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}


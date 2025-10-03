import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );

  const toggleInventory = () => setInventoryOpen(!inventoryOpen);

  return (
    <div className="flex min-h-screen bg-base-100">
      {/* Sidebar */}
      <aside className="w-64 bg-base-200 p-4">
        <h1 className="text-2xl font-bold mb-6">Inventory System</h1>

        <ul className="menu bg-base-200 w-full rounded-box">
          {/* Dashboard */}
          <li>
            <Link
              to="/"
              className={
                location.pathname === "/" ? "active font-bold text-primary" : ""
              }
            >
              Dashboard
            </Link>
          </li>

          {/* Inventory Section */}
          <li tabIndex={0}>
            <button className="w-full text-left" onClick={toggleInventory}>
              Inventory
            </button>
            {inventoryOpen && (
              <ul className="p-2">
                <li>
                  <Link
                    to="/inventory"
                    className={
                      location.pathname === "/inventory" ? "active" : ""
                    }
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/inventory/brands"
                    className={
                      location.pathname === "/inventory/brands" ? "active" : ""
                    }
                  >
                    Brands
                  </Link>
                </li>
                <li>
                  <Link
                    to="/inventory/categories"
                    className={
                      location.pathname === "/inventory/categories" ? "active" : ""
                    }
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Other Sections */}
          <li>
            <Link
              to="/sales"
              className={location.pathname === "/sales" ? "active" : ""}
            >
              Sales
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={location.pathname === "/settings" ? "active" : ""}
            >
              Settings
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}


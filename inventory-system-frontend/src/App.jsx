import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales/Sales";
import AddSale from "./pages/Sales/AddSale";
import Settings from "./pages/Settings";
import Brands from "./pages/Brands";
import Categories from "./pages/Categories";
import Login from "./pages/auth/Login";
import Users from "./pages/users/Users";
import AddUser from "./pages/users/AddUser";
import EditUser from "./pages/users/EditUser";
import AccountSettings from "./pages/AccountSettings";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  // Staff + Admin routes
  {
    element: <ProtectedRoute allowedRoles={["admin", "staff"]} />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          {
            path: "sales",
            children: [
              { index: true, element: <Sales /> },
              { path: "add", element: <AddSale /> },
            ],
          },
          { path: "account", element: <AccountSettings /> }

        ],
      },
    ],
  },

  // Admin-only routes
  {
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          // Inventory routes
          {
            path: "inventory",
            children: [
              { index: true, element: <Inventory /> },
              { path: "brands", element: <Brands /> },
              { path: "categories", element: <Categories /> },
            ],
          },
          // Users routes
          {
            path: "users",
            children: [
              { index: true, element: <Users /> },
              { path: "add", element: <AddUser /> },
              { path: "edit/:id", element: <EditUser /> },
            ],
          },
          // Settings route
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

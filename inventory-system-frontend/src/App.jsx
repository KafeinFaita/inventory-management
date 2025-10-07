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
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  // All dashboard routes require login
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
          { path: "profile", element: <Dashboard /> }, // or a profile page component
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
          {
            path: "inventory",
            children: [
              { index: true, element: <Inventory /> },
              { path: "brands", element: <Brands /> },
              { path: "categories", element: <Categories /> }
            ],
          },
          { path: "settings", element: <Settings /> },
          { path: "users", element: <Users /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

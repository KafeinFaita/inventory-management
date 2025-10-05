import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales/Sales"; // main Sales report page
import AddSale from "./pages/Sales/AddSale"; // add sale page
import Settings from "./pages/Settings";
import Brands from "./pages/Brands";
import Categories from "./pages/Categories";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />, // protect all dashboard routes
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          {
            path: "inventory",
            children: [
              { index: true, element: <Inventory /> },
              { path: "brands", element: <Brands /> },
              { path: "categories", element: <Categories /> },
            ],
          },
          {
            path: "sales",
            children: [
              { index: true, element: <Sales /> },
              { path: "add", element: <AddSale /> },
            ],
          },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
]);

export default function App() {
  console.log("App loaded ✅");
  return <RouterProvider router={router} />;
}

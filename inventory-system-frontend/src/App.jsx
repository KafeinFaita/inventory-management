import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Brands from "./pages/Brands";
import Categories from "./pages/Categories";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "inventory",
        children: [
          { index: true, element: <Inventory /> }, // /inventory
          { path: "brands", element: <Brands /> },  // /inventory/brands
          { path: "categories", element: <Categories /> }, // /inventory/categories
        ],
      },
      { path: "sales", element: <Sales /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);


export default function App() {
  console.log("App loaded ✅");
  return <RouterProvider router={router} />;
}

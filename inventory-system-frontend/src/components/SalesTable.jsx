// src/components/SalesTable.jsx
import { useState, useMemo } from "react";
import { generatePDF } from "../utils/generatePDF";
import { API_URL } from "../config";

export default function SalesTable({ sales = [] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  // Staff filter now stores user ID (not name) for backend/export consistency
  const [filterStaff, setFilterStaff] = useState("");

  const ITEMS_PER_PAGE = 20;

  // Build unique option lists (brand/category from populated products, staff by user ID)
  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sales.flatMap((s) =>
            s.items.map((i) => i.product?.brand).filter(Boolean)
          )
        )
      ).sort(),
    [sales]
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sales.flatMap((s) =>
            s.items.map((i) => i.product?.category).filter(Boolean)
          )
        )
      ).sort(),
    [sales]
  );

  const staffOptions = useMemo(() => {
    // Map by ID to avoid duplicates when names repeat
    const map = new Map();
    for (const s of sales) {
      const id = s.user?._id;
      const name = s.user?.name;
      if (id && name && !map.has(id)) map.set(id, name);
    }
    // Return [{ id, name }, ...] sorted by name
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sales]);

  // 🔍 Filter and sort
  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        const monthMatch = filterMonth
          ? new Date(sale.createdAt).getMonth() + 1 === Number(filterMonth)
          : true;
        const yearMatch = filterYear
          ? new Date(sale.createdAt).getFullYear() === Number(filterYear)
          : true;
        const brandMatch = filterBrand
          ? sale.items.some((i) => i.product?.brand === filterBrand)
          : true;
        const categoryMatch = filterCategory
          ? sale.items.some((i) => i.product?.category === filterCategory)
          : true;
        // Staff filter now compares by user ID for consistency with export
        const staffMatch = filterStaff
          ? (sale.user?._id || "") === filterStaff
          : true;

        const searchLower = search.toLowerCase();
        const matchesSearch =
          sale.user?.name?.toLowerCase().includes(searchLower) ||
          sale.items.some(
            (i) =>
              (i.product?.name || "Unknown")
                .toLowerCase()
                .includes(searchLower) ||
              (i.variants &&
                i.variants.some((v) =>
                  v.option?.toLowerCase().includes(searchLower)
                ))
          );

        return (
          monthMatch &&
          yearMatch &&
          brandMatch &&
          categoryMatch &&
          staffMatch &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "dateAsc":
            return new Date(a.createdAt) - new Date(b.createdAt);
          case "dateDesc":
            return new Date(b.createdAt) - new Date(a.createdAt);
          case "alpha":
            return (a.items[0]?.product?.name || "").localeCompare(
              b.items[0]?.product?.name || ""
            );
          case "quantity":
            return (
              b.items.reduce((sum, i) => sum + i.quantity, 0) -
              a.items.reduce((sum, i) => sum + i.quantity, 0)
            );
          case "amount":
            return (
              b.items.reduce((sum, i) => sum + i.priceAtSale * i.quantity, 0) -
              a.items.reduce((sum, i) => sum + i.priceAtSale * i.quantity, 0)
            );
          default:
            return 0;
        }
      });
  }, [
    sales,
    search,
    filterMonth,
    filterYear,
    sortBy,
    filterBrand,
    filterCategory,
    filterStaff,
  ]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ⚙️ PDF handler
  const handleViewInvoice = (sale) => {
    try {
      generatePDF(sale);
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  // 📤 Export handler
  const handleExport = () => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    // Only set non-empty filters
    if (filterBrand) params.set("brand", filterBrand);
    if (filterCategory) params.set("category", filterCategory);
    if (filterStaff) params.set("staff", filterStaff); // user ID

    // Apply year/month filters
    if (filterYear) {
      params.set("start", `${filterYear}-01-01`);
      params.set("end", `${filterYear}-12-31`);
    }
    if (filterMonth && filterYear) {
      const start = new Date(filterYear, filterMonth - 1, 1);
      const end = new Date(filterYear, filterMonth, 0);
      params.set("start", start.toISOString().split("T")[0]);
      params.set("end", end.toISOString().split("T")[0]);
    }

    // Sorting
    if (sortBy.includes("date")) {
      params.set("sort", "date");
      params.set("order", sortBy === "dateAsc" ? "asc" : "desc");
    } else if (sortBy === "amount") {
      params.set("sort", "amount");
      params.set("order", "desc");
    }

    fetch(`${API_URL}/api/sales/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        // Optional: handle non-200 responses to avoid downloading an error page
        if (!res.ok) throw new Error(`Export failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sales-report.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Export failed:", err);
        alert("Failed to export report");
      });
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg shadow w-full">
      {/* Controls */}
      <div className="overflow-x-auto mb-4">
        <div className="flex flex-wrap gap-2 items-center min-w-full">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by product, variant, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm flex-1 min-w-0"
          />

          {/* Month */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="">All Years</option>
            {Array.from(
              new Set(sales.map((s) => new Date(s.createdAt).getFullYear()))
            )
              .sort((a, b) => b - a)
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>

          {/* Brand */}
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="">All Brands</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Staff (IDs as values, names as labels) */}
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="">All Staff</option>
            {staffOptions.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select select-bordered select-sm flex-shrink-0"
          >
            <option value="dateDesc">Date (Newest)</option>
            <option value="dateAsc">Date (Oldest)</option>
            <option value="alpha">Product Name (A-Z)</option>
            <option value="quantity">Total Quantity Sold</option>
            <option value="amount">Total Amount Sold</option>
          </select>

          {/* 🚀 Export Button */}
          <button className="btn btn-sm btn-primary ml-auto" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <p className="text-sm text-gray-500 mb-2 md:hidden text-center">
          Swipe horizontally to see all columns →
        </p>
        <table className="table table-zebra table-compact w-full min-w-max">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Items</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Total Quantity</th>
              <th>Total Amount (₱)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                {/* Updated colSpan to match 8 columns */}
                <td colSpan="8" className="text-center text-gray-500 py-4">
                  No sales found for the selected filters.
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => {
                const totalQuantity = sale.items.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                );
                const totalAmount = sale.items.reduce(
                  (sum, i) => sum + i.priceAtSale * i.quantity,
                  0
                );

                return (
                  <tr key={sale._id}>
                    <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td>{sale.user?.name || "N/A"}</td>
                    <td className="flex flex-wrap gap-1 max-w-xs">
                      {sale.items.map((i, idx) => {
                        const variantLabel =
                          i.variants && i.variants.length > 0
                            ? ` (${i.variants.map((v) => v.option).join(", ")})`
                            : "";
                        return (
                          <span
                            key={`${sale._id}-${i.product?._id || i._id || idx}`}
                            className="badge badge-sm badge-primary truncate"
                          >
                            {i.product?.name || "Unknown"}
                            {variantLabel} × {i.quantity}
                          </span>
                        );
                      })}
                    </td>

                    <td>
                      {[...new Set(sale.items.map((i) => i.product?.brand).filter(Boolean))].join(", ") || "N/A"}
                    </td>
                    <td>
                      {[...new Set(sale.items.map((i) => i.product?.category).filter(Boolean))].join(", ") || "N/A"}
                    </td>

                    <td>{totalQuantity}</td>
                    <td className="font-bold text-success">
                      ₱{totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline btn-primary"
                        onClick={() => handleViewInvoice(sale)}
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <button
            className="btn btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn btn-sm ${
                currentPage === i + 1 ? "btn-active" : ""
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
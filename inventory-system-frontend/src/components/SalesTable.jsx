// src/components/SalesTable.jsx
import { useState, useMemo } from "react";
import { generatePDF } from "../utils/generatePDF";

export default function SalesTable({ sales = [] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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
        const searchLower = search.toLowerCase();
        const matchesSearch =
          sale.user?.name?.toLowerCase().includes(searchLower) ||
          sale.items.some((i) =>
            (i.product?.name || "Unknown").toLowerCase().includes(searchLower) ||
            (i.variants &&
              i.variants.some((v) =>
                v.option?.toLowerCase().includes(searchLower)
              ))
          );
        return monthMatch && yearMatch && matchesSearch;
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
            const totalA = a.items.reduce((sum, i) => sum + i.quantity, 0);
            const totalB = b.items.reduce((sum, i) => sum + i.quantity, 0);
            return totalB - totalA;
          case "amount":
            const amountA = a.items.reduce(
              (sum, i) => sum + i.priceAtSale * i.quantity,
              0
            );
            const amountB = b.items.reduce(
              (sum, i) => sum + i.priceAtSale * i.quantity,
              0
            );
            return amountB - amountA;
          default:
            return 0;
        }
      });
  }, [sales, search, filterMonth, filterYear, sortBy]);

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

  return (
    <div className="bg-base-200 p-4 rounded-lg shadow w-full">
      {/* Controls */}
      <div className="overflow-x-auto mb-4">
        <div className="flex flex-wrap gap-2 items-center min-w-full">
          <input
            type="text"
            placeholder="Search by product, variant, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm flex-1 min-w-0"
          />
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
              <th>Total Quantity</th>
              <th>Total Amount (₱)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-4">
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
// DataTable.jsx
import { useDataTable } from "../contexts/DataTableContext";

export default function DataTable({ columns, onEdit, onDelete }) {
  const {
    data,
    loading,
    page,
    totalPages,
    pageSize,
    sortField,
    sortOrder,
    setSort,
    search,
    setSearch,
    filters,
    setFilters,
    setPage,
    setPageSize,
  } = useDataTable();

  return (
    <div className="overflow-x-auto bg-base-100 p-6 rounded-xl shadow-md">
      {/* --- Toolbar --- */}
      <div className="flex justify-between mb-4 flex-wrap gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input input-bordered w-64"
        />

        {/* Example: dynamic filters */}
        {filters && setFilters && Object.keys(filters).length > 0 && (
          <div className="flex gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <input
                key={key}
                type="text"
                placeholder={`Filter by ${key}`}
                value={value}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="input input-bordered"
              />
            ))}
          </div>
        )}

        {/* Page size */}
        <select
          className="select select-bordered w-28"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[10, 20, 50].map((opt) => (
            <option key={opt} value={opt}>
              {opt} / page
            </option>
          ))}
        </select>
      </div>

      {/* --- Table --- */}
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.field}
                className="cursor-pointer select-none"
                onClick={() => setSort(col.field)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sortField === col.field && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </span>
              </th>
            ))}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-6">
                <span className="loading loading-spinner text-primary"></span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-6">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id}>
                {columns.map((col) => (
                  <td key={col.field}>
                    {col.type === "date" && row[col.field]
                      ? new Date(row[col.field]).toLocaleString()
                      : row[col.field]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="space-x-2">
                    {onEdit && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => onEdit(row)}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => onDelete(row._id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- Pagination --- */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="btn btn-sm"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-sm"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
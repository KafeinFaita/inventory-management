// components/Inventory/InventoryTable.jsx
import React from "react";

export default function InventoryTable({
  products,
  loading,
  expandedRows,
  toggleRow,
  handleEdit,
  handleDelete,
}) {
  return (
    <div className="overflow-x-auto bg-base-100 p-6 rounded-xl shadow-md mt-2">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <table className="table table-zebra w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th></th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Has Variants</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.hasVariants
                ? p.variants.reduce((sum, v) => sum + v.stock, 0)
                : p.stock;
              const priceRange = p.hasVariants
                ? `${Math.min(...p.variants.map((v) => v.price))}–${Math.max(...p.variants.map((v) => v.price))}`
                : p.price;

              return (
                <React.Fragment key={p._id}>
                  <tr className={!p.hasVariants && p.stock <= 5 ? "bg-error/10 text-error" : ""}>
                    <td>
                      {p.hasVariants && (
                        <button
  type="button"
  className="btn btn-xs btn-outline text-xs whitespace-nowrap"
  onClick={() => toggleRow(p._id)}
>
  {expandedRows[p._id] ? "Hide Variants ▾" : "View Variants ▸"}
</button>


                      )}
                    </td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.category}</td>
                    <td>{p.hasVariants ? "Yes" : "No"}</td>
                    <td>{p.hasVariants ? totalStock : p.stock}</td>
                    <td>{p.hasVariants ? `₱${priceRange}` : `₱${p.price}`}</td>
                    <td className="space-x-2">
                      <button className="btn btn-sm btn-info" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-error" onClick={() => handleDelete(p._id)}>Delete</button>
                    </td>
                  </tr>
                  {p.hasVariants && expandedRows[p._id] && (
                    <tr className="bg-base-200">
                      <td colSpan={8}>
                        <div className="overflow-x-auto rounded-lg border bg-base-100 shadow-sm p-4">
                          <h4 className="font-semibold mb-2">Variants</h4>
                          <table className="table table-compact w-full">
                            <thead className="bg-base-200">
                              <tr>
                                {Object.keys(p.variants[0].attributes).map((cat, i) => (
                                  <th key={i}>{cat}</th>
                                ))}
                                <th>Stock</th>
                                <th>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.variants.map((v, i) => (
                                <tr key={i}>
                                  {Object.values(v.attributes).map((val, j) => (
                                    <td key={j}>{val}</td>
                                  ))}
                                  <td>{v.stock}</td>
                                  <td>₱{v.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
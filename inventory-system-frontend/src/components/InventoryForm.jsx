import React from "react";

export default function InventoryForm({
  showForm,
  editingId,
  submitting,
  name, setName,
  brand, setBrand,
  category, setCategory,
  brands,
  categories,
  hasVariants, setHasVariants,
  variantCategories,
  addVariantCategory,
  removeVariantCategory,
  updateVariantCategoryName,
  addOption,
  updateOption,
  removeOption,
  variantCombinations, setVariantCombinations,
  generatedCombinations,
  updateCombinationField,
  nonVariantStock, setNonVariantStock,
  nonVariantPrice, setNonVariantPrice,
  handleSubmit,
  handleCancel,
}) {
  if (!showForm) return null;

  return (
    <form
      className="space-y-4 bg-base-100 p-6 rounded-xl shadow-md mt-4"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold">
        {editingId ? "Edit Product" : "Add Product"}
      </h2>

      <div className="divider">Basic info</div>
      <div>
        <label className="block font-semibold mb-1">Product name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered w-full"
          required
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Brand</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="select select-bordered w-full"
            required
            disabled={submitting}
          >
            <option value="">Select a brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select select-bordered w-full"
            required
            disabled={submitting}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!hasVariants && (
        <>
          <div className="divider">Stock and price</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={nonVariantStock}
                onChange={(e) => setNonVariantStock(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={nonVariantPrice}
                onChange={(e) => setNonVariantPrice(Number(e.target.value))}
                className="input input-bordered w-full"
                disabled={submitting}
              />
            </div>
          </div>
        </>
      )}

      <div className="divider">Variants</div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => setHasVariants(e.target.checked)}
          disabled={submitting}
        />
        <label>Enable variants</label>
      </div>

      {hasVariants && variantCategories.map((vc, i) => (
        <div key={i} className="border p-3 rounded-lg mb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Variant category (e.g., Color)"
              value={vc.category}
              onChange={(e) => updateVariantCategoryName(i, e.target.value)}
              className="input input-bordered w-full"
              disabled={submitting}
            />
            <button
              type="button"
              className="btn btn-sm btn-error"
              onClick={() => removeVariantCategory(i)}
              disabled={submitting}
            >
              Remove
            </button>
          </div>
          {vc.options.map((opt, j) => (
            <div key={j} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Option"
                value={opt}
                onChange={(e) => updateOption(i, j, e.target.value)}
                className="input input-bordered w-full"
                disabled={submitting}
              />
              <button
                type="button"
                className="btn btn-sm btn-error"
                onClick={() => removeOption(i, j)}
                disabled={submitting}
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => addOption(i)}
            disabled={submitting}
          >
            + Add option
          </button>
        </div>
      ))}

      {hasVariants && (
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={addVariantCategory}
          disabled={submitting}
        >
          + Add variant category
        </button>
      )}

      {hasVariants && generatedCombinations.length > 0 && (
        <>
          <div className="divider">Variant combinations</div>
          <div className="overflow-x-auto bg-base-100 p-3 rounded-lg border">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200 sticky top-0">
                <tr>
                  {variantCategories.map((vc, i) => (
                    <th key={i}>{vc.category}</th>
                  ))}
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
  {variantCombinations.map((v, i) => (
    <tr key={i}>
      {variantCategories.map((vc, j) => (
        <td key={j}>{v.attributes[vc.category]}</td>
      ))}
      <td>
        <input
          type="number"
          min="0"
          value={v.stock}
          onChange={(e) =>
            updateCombinationField(i, "stock", e.target.value)
          }
          className="input input-bordered w-full"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={v.price}
          onChange={(e) =>
            updateCombinationField(i, "price", e.target.value)
          }
          className="input input-bordered w-full"
        />
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </>
      )}

        <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className={`btn btn-primary ${submitting ? "loading" : ""}`}
        >
          {editingId ? "Update product" : "Add product"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
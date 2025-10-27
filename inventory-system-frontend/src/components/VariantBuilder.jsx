// components/forms/VariantBuilder.jsx
export default function VariantBuilder({
  variantCategories,
  setVariantCategories,
  variantCombinations,
  setVariantCombinations,
  generatedCombinations,
  setValues,
  submitting,
}) {
  const addVariantCategory = () => {
    setVariantCategories([...variantCategories, { category: "", options: [] }]);
  };

  const removeVariantCategory = (i) => {
    setVariantCategories(variantCategories.filter((_, idx) => idx !== i));
  };

  const updateVariantCategoryName = (i, name) => {
    const updated = [...variantCategories];
    updated[i].category = name;
    setVariantCategories(updated);
  };

  const addOption = (i) => {
    const updated = [...variantCategories];
    updated[i].options.push("");
    setVariantCategories(updated);
  };

  const updateOption = (i, j, value) => {
    const updated = [...variantCategories];
    updated[i].options[j] = value;
    setVariantCategories(updated);
  };

  const removeOption = (i, j) => {
    const updated = [...variantCategories];
    updated[i].options.splice(j, 1);
    setVariantCategories(updated);
  };

  const updateCombinationField = (i, field, value) => {
    const updated = [...variantCombinations];
    updated[i][field] = value;
    setVariantCombinations(updated);
  };

  return (
    <div className="space-y-4">
      {variantCategories.map((vc, i) => (
        <div key={i} className="border p-3 rounded-lg space-y-2">
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

      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick={addVariantCategory}
        disabled={submitting}
      >
        + Add variant category
      </button>

      {generatedCombinations.length > 0 && (
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
                      onChange={(e) => updateCombinationField(i, "stock", e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price}
                      onChange={(e) => updateCombinationField(i, "price", e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
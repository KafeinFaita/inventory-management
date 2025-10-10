import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

const token = localStorage.getItem("token");
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { Authorization: `Bearer ${token}` },
});

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Product form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variantCategories, setVariantCategories] = useState([]);
  // variantCategories = [{ category: "Color", options: ["Blue","Red"] }, { category: "Storage", options: ["128GB","256GB"] }]
  const [variantCombinations, setVariantCombinations] = useState([]);
  // variantCombinations = [{ attributes: {Color:"Blue", Storage:"256GB"}, stock: 0, price: 0 }]

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await Promise.allSettled([fetchProducts(), fetchBrands(), fetchCategories()]);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load inventory data." });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch products." });
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/brands");
      setBrands(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch brands." });
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch categories." });
    }
  };

  const showSuccess = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ---------- Variant Handlers ----------

  const addVariantCategory = () => setVariantCategories([...variantCategories, { category: "", options: [""] }]);
  const removeVariantCategory = (index) => {
    const newCategories = [...variantCategories];
    newCategories.splice(index, 1);
    setVariantCategories(newCategories);
    generateCombinations(newCategories);
  };
  const updateVariantCategoryName = (index, value) => {
    const newCategories = [...variantCategories];
    newCategories[index].category = value;
    setVariantCategories(newCategories);
    generateCombinations(newCategories);
  };
  const addOption = (catIndex) => {
    const newCategories = [...variantCategories];
    newCategories[catIndex].options.push("");
    setVariantCategories(newCategories);
    generateCombinations(newCategories);
  };
  const updateOption = (catIndex, optIndex, value) => {
    const newCategories = [...variantCategories];
    newCategories[catIndex].options[optIndex] = value;
    setVariantCategories(newCategories);
    generateCombinations(newCategories);
  };
  const removeOption = (catIndex, optIndex) => {
    const newCategories = [...variantCategories];
    newCategories[catIndex].options.splice(optIndex, 1);
    setVariantCategories(newCategories);
    generateCombinations(newCategories);
  };

  // ---------- Generate all combinations ----------
  const generateCombinations = (categoriesArray) => {
    if (!categoriesArray.length || categoriesArray.some(c => !c.category || c.options.length === 0)) {
      setVariantCombinations([]);
      return;
    }

    const combos = cartesianProduct(categoriesArray.map(c => c.options.map(opt => ({ [c.category]: opt }))));
    const formatted = combos.map(c => {
      const attributes = Object.assign({}, ...c);
      const existing = variantCombinations.find(v => JSON.stringify(v.attributes) === JSON.stringify(attributes));
      return { attributes, stock: existing?.stock || 0, price: existing?.price || 0 };
    });
    setVariantCombinations(formatted);
  };

  const cartesianProduct = (arrays) => {
    return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
  };

  const updateCombinationField = (index, field, value) => {
    const newCombinations = [...variantCombinations];
    if (field === "stock" || field === "price") value = Number(value);
    newCombinations[index][field] = value;
    setVariantCombinations(newCombinations);
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!name.trim() || !brand || !category) {
      setMessage({ type: "error", text: "Please fill in all required fields." });
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      brand,
      category,
      hasVariants,
      variants: hasVariants ? variantCombinations : [],
      stock: hasVariants ? 0 : variantCombinations.length === 0 ? 0 : variantCombinations[0].stock,
      price: hasVariants ? 0 : variantCombinations.length === 0 ? 0 : variantCombinations[0].price,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showSuccess("Product updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/products", payload);
        showSuccess("Product added successfully!");
      }

      // Reset
      setName(""); setBrand(""); setCategory("");
      setHasVariants(false); setVariantCategories([]); setVariantCombinations([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to save product. Please try again.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setName(product.name); setBrand(product.brand); setCategory(product.category);
    setHasVariants(product.hasVariants);

    if (product.hasVariants && product.variants?.length) {
      const cats = {};
      product.variants.forEach(v => {
        Object.entries(v.attributes).forEach(([cat, val]) => {
          if (!cats[cat]) cats[cat] = new Set();
          cats[cat].add(val);
        });
      });
      const catArray = Object.entries(cats).map(([cat, setVals]) => ({ category: cat, options: Array.from(setVals) }));
      setVariantCategories(catArray);

      const combos = product.variants.map(v => ({ attributes: v.attributes, stock: v.stock, price: v.price }));
      setVariantCombinations(combos);
    } else {
      setVariantCategories([]);
      setVariantCombinations([]);
    }

    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      showSuccess("Product deleted successfully!");
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to delete product.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null); setName(""); setBrand(""); setCategory("");
    setHasVariants(false); setVariantCategories([]); setVariantCombinations([]);
  };

  // ---------- Render ----------
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Inventory</h1>

      {message && message.type === "error" && (
        <div className="alert alert-error shadow-lg flex justify-between items-center mb-4">
          <span>{message.text}</span>
          <button className="btn btn-sm btn-primary" onClick={() => { setMessage(null); fetchAllData(); }}>Retry</button>
        </div>
      )}
      {message && message.type === "success" && (
        <div className="alert alert-success shadow-lg mb-4 transition-opacity duration-500">{message.text}</div>
      )}

      {/* Add/Edit Form */}
      <form className="space-y-4 bg-base-200 p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Product" : "Add Product"}</h2>

        <div>
          <label className="block font-semibold mb-1">Product Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
                 className="input input-bordered w-full" required disabled={submitting} />
        </div>

        <div>
          <label className="block font-semibold mb-1">Brand</label>
          <select value={brand} onChange={e => setBrand(e.target.value)} className="select select-bordered w-full"
                  required disabled={submitting}>
            <option value="">Select a brand</option>
            {brands.map(b => (<option key={b._id} value={b.name}>{b.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="select select-bordered w-full"
                  required disabled={submitting}>
            <option value="">Select a category</option>
            {categories.map(c => (<option key={c._id} value={c.name}>{c.name}</option>))}
          </select>
        </div>

        {/* Variant Toggle */}
        <div className="flex items-center space-x-2">
          <input type="checkbox" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
          <label>Enable Variants</label>
        </div>

        {/* Variant Categories */}
        {hasVariants && variantCategories.map((vc, i) => (
          <div key={i} className="border p-3 rounded mb-3 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <input type="text" placeholder="Variant Category (e.g., Color)" value={vc.category}
                     onChange={e => updateVariantCategoryName(i, e.target.value)}
                     className="input input-bordered w-full" />
              <button type="button" className="btn btn-sm btn-error ml-2" onClick={() => removeVariantCategory(i)}>Remove Category</button>
            </div>

            {/* Options */}
            {vc.options.map((opt, j) => (
              <div key={j} className="flex items-center mb-1">
                <input type="text" placeholder="Option" value={opt}
                       onChange={e => updateOption(i, j, e.target.value)}
                       className="input input-bordered w-full" />
                <button type="button" className="btn btn-sm btn-error ml-2" onClick={() => removeOption(i, j)}>X</button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-primary mt-1" onClick={() => addOption(i)}>Add Option</button>
          </div>
        ))}
        {hasVariants && <button type="button" className="btn btn-sm btn-secondary" onClick={addVariantCategory}>Add Variant Category</button>}

        {/* Variant Combinations */}
        {hasVariants && variantCombinations.length > 0 && (
          <div className="overflow-x-auto bg-base-200 p-3 rounded mt-4">
            <h3 className="font-semibold mb-2">Variant Combinations</h3>
            <table className="table w-full">
              <thead>
                <tr>
                  {variantCategories.map((vc, i) => <th key={i}>{vc.category}</th>)}
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {variantCombinations.map((v, i) => (
                  <tr key={i}>
                    {variantCategories.map((vc, j) => <td key={j}>{v.attributes[vc.category]}</td>)}
                    <td>
                      <input type="number" min="0" value={v.stock} onChange={e => updateCombinationField(i, "stock", e.target.value)}
                             className="input input-bordered w-full" />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" value={v.price} onChange={e => updateCombinationField(i, "price", e.target.value)}
                             className="input input-bordered w-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit */}
        <div className="space-x-2 mt-4">
          <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`}>{editingId ? "Update Product" : "Add Product"}</button>
          {editingId && <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={submitting}>Cancel</button>}
        </div>
      </form>

      {/* Products Table */}
      <div className="overflow-x-auto bg-base-200 p-6 rounded-lg shadow mt-6">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Name</th><th>Brand</th><th>Category</th><th>Has Variants</th><th>Stock / Price</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className={(!p.hasVariants && p.stock <= 5) ? "bg-red-100" : ""}>
                <td>{p.name}</td>
                <td>{p.brand}</td>
                <td>{p.category}</td>
                <td>{p.hasVariants ? "Yes" : "No"}</td>
                <td>
                  {p.hasVariants ? (
                    <table className="table-auto w-full border">
                      <thead>
                        <tr>{p.variants?.length > 0 && Object.keys(p.variants[0].attributes).map((cat,i) => <th key={i}>{cat}</th>)}<th>Stock</th><th>Price</th></tr>
                      </thead>
                      <tbody>
                        {p.variants?.map((v,i) => (
                          <tr key={i}>
                            {Object.values(v.attributes).map((val,j) => <td key={j}>{val}</td>)}
                            <td>{v.stock}</td>
                            <td>{v.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : `${p.stock} / ${p.price}`}
                </td>
                <td className="space-x-2">
                  <button className="btn btn-sm btn-info" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="6" className="text-center py-4">No products found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

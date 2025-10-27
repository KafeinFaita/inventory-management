// Inventory
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import Alert from "../components/Alert";

export default function Inventory() {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variantCategories, setVariantCategories] = useState([]);
  const [variantCombinations, setVariantCombinations] = useState([]);
  const [generatedCombinations, setGeneratedCombinations] = useState([]);

  const [nonVariantStock, setNonVariantStock] = useState(0);
  const [nonVariantPrice, setNonVariantPrice] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // NEW: search/filter/sort/pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const messageRef = useRef(null);

  // --- API setup ---
  const getApi = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: `${API_URL}/api`,
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // --- Data fetching ---
  useEffect(() => {
    fetchAllData();
  }, [page, limit, searchTerm, filterBrand, filterCategory, sortField, sortOrder]);

  const fetchAllData = async () => {
    setLoading(true);
    setMessage(null);
    const api = getApi();
    try {
      await Promise.allSettled([
        fetchProducts(api),
        fetchBrands(api),
        fetchCategories(api),
      ]);
    } catch {
      setMessage({ type: "error", text: "Failed to load inventory data." });
    } finally {
      setLoading(false);
    }
  };

const fetchProducts = async (api) => {
  try {
    const res = await api.get("/products", {
      params: {
        page,
        limit,
        search: searchTerm,
        brand: filterBrand,
        category: filterCategory,
        sort: sortField,
        order: sortOrder,
      },
    });

    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    const normalized = raw.map((p) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const safeVariants = variants.map((v) => ({
        attributes: typeof v.attributes === "object" && v.attributes ? v.attributes : {},
        stock: typeof v.stock === "number" ? v.stock : 0,
        price: typeof v.price === "number" ? v.price : 0,
      }));

      return {
        _id: p._id,
        name: p.name ?? "",
        brand: p.brand ?? "",
        category: p.category ?? "",
        hasVariants: !!p.hasVariants,
        stock: typeof p.stock === "number" ? p.stock : 0,
        price: typeof p.price === "number" ? p.price : 0,
        variants: safeVariants,
      };
    });

    setProducts(normalized);
    setTotalPages(typeof res.data?.totalPages === "number" ? res.data.totalPages : 1);
  } catch {
    setMessage({ type: "error", text: "Failed to fetch products." });
  }
};

const fetchBrands = async (api) => {
  try {
    const res = await api.get("/brands/all");

    // Normalize response: handle paginated { data: [...] } or plain array
    const raw = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
      ? res.data
      : [];

    const normalized = raw.map((b) => ({
      _id: b._id,
      name: b.name ?? "",
    }));

    setBrands(normalized);
  } catch {
    setMessage({ type: "error", text: "Failed to fetch brands." });
  }
};

  const fetchCategories = async (api) => {
    try {
      const res = await api.get("/categories/all");

      // Normalize response: handle paginated { data: [...] } or plain array
      const raw = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      const normalized = raw.map((c) => ({
        _id: c._id,
        name: c.name ?? "",
      }));

      setCategories(normalized);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch categories." });
    }
  };

  // --- Helpers ---
  const showSuccess = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setBrand("");
    setCategory("");
    setHasVariants(false);
    setVariantCategories([]);
    setVariantCombinations([]);
    setGeneratedCombinations([]);
    setNonVariantStock(0);
    setNonVariantPrice(0);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // --- Variant builder helpers ---
  const addVariantCategory = () =>
    setVariantCategories([...variantCategories, { category: "", options: [""] }]);

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

  const cartesianProduct = (arrays) =>
    arrays.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);

  const generateCombinations = (categoriesArray) => {
    if (
      !categoriesArray.length ||
      categoriesArray.some((c) => !c.category || c.options.length === 0)
    ) {
      setGeneratedCombinations([]);
      setVariantCombinations([]);
      return;
    }

    const combos = cartesianProduct(
      categoriesArray.map((c) => c.options.map((opt) => ({ [c.category]: opt })))
    );

    const formatted = combos.map((c) => {
      const attributes = Object.assign({}, ...c);
      const existing = variantCombinations.find(
        (v) => JSON.stringify(v.attributes) === JSON.stringify(attributes)
      );
      return {
        attributes,
        stock: existing?.stock || 0,
        price: existing?.price || 0,
      };
    });

    setGeneratedCombinations(formatted);
  };

  const updateCombinationField = (index, field, value) => {
    setVariantCombinations((prev) => {
      const newCombinations = [...prev];
      newCombinations[index] = {
        ...newCombinations[index],
        [field]: Number(value),
      };
      return newCombinations;
    });
  };

  // --- Form + CRUD handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const api = getApi();

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
      ...(hasVariants
        ? { variants: variantCombinations }
        : { stock: nonVariantStock, price: nonVariantPrice }),
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
      fetchProducts(api);
      setShowForm(false);
      resetForm();
    } catch (err) {
      const backendMsg =
        err.response?.data?.error || "Failed to save product. Please try again.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (product) => {
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setHasVariants(product.hasVariants);

    if (product.hasVariants && product.variants?.length) {
      const cats = {};
      product.variants.forEach((v) => {
        Object.entries(v.attributes).forEach(([cat, val]) => {
          if (!cats[cat]) cats[cat] = new Set();
          cats[cat].add(val);
        });
      });
            const catArray = Object.entries(cats).map(([cat, setVals]) => ({
        category: cat,
        options: Array.from(setVals),
      }));
      setVariantCategories(catArray);

      const combos = product.variants.map((v) => ({
        attributes: v.attributes,
        stock: v.stock,
        price: v.price,
      }));
      setVariantCombinations(combos);
      setGeneratedCombinations(combos);
    } else {
      setVariantCategories([]);
      setVariantCombinations([]);
      setGeneratedCombinations([]);
      setNonVariantStock(product.stock || 0);
      setNonVariantPrice(product.price || 0);
    }

    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setSubmitting(true);
    try {
      const api = getApi();
      await api.delete(`/products/${id}`);
      fetchProducts(api);
      showSuccess("Product deleted successfully!");
    } catch (err) {
      const backendMsg =
        err.response?.data?.error || "Failed to delete product.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Product
        </button>
      </div>

      <Alert
        message={message}
        onRetry={fetchAllData}
        clearMessage={() => setMessage(null)}
      />

      {/* --- Controls Toolbar --- */}
      <div className="card bg-base-100 shadow-sm p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left side: search + filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="input input-bordered pl-9 w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Brand filter */}
          <select
            className="select select-bordered w-40"
            value={filterBrand}
            onChange={(e) => {
              setFilterBrand(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            className="select select-bordered w-40"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right side: sort + page size */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort field */}
          <select
            className="select select-bordered w-40"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
            <option value="brand">Brand</option>
            <option value="category">Category</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>

          {/* Sort order */}
          <select
            className="select select-bordered w-28"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          {/* Page size */}
          <select
            className="select select-bordered w-28"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
      </div>

      <InventoryForm
        showForm={showForm}
        editingId={editingId}
        submitting={submitting}
        name={name}
        setName={setName}
        brand={brand}
        setBrand={setBrand}
        category={category}
        setCategory={setCategory}
        brands={brands}
        categories={categories}
        hasVariants={hasVariants}
        setHasVariants={setHasVariants}
        variantCategories={variantCategories}
        variantCombinations={variantCombinations}
        generatedCombinations={generatedCombinations}
        nonVariantStock={nonVariantStock}
        setNonVariantStock={setNonVariantStock}
        nonVariantPrice={nonVariantPrice}
        setNonVariantPrice={setNonVariantPrice}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        addVariantCategory={addVariantCategory}
        removeVariantCategory={removeVariantCategory}
        updateVariantCategoryName={updateVariantCategoryName}
        addOption={addOption}
        updateOption={updateOption}
        removeOption={removeOption}
        updateCombinationField={updateCombinationField}
      />

      {/* --- Table with loading & empty states --- */}
      {loading ? (
        // Loading skeleton
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <div className="animate-pulse h-6 bg-base-200 rounded"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : products.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <span className="text-5xl mb-4">📦</span>
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Add your first product to get started.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        </div>
      ) : (
        // Normal table
        <InventoryTable
          products={products}
          expandedRows={expandedRows}
          toggleRow={toggleRow}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {/* Prev */}
        <button
          className="btn btn-sm"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        {/* Page numbers with ellipses */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p =>
            // Always show first, last, current, and neighbors
            p === 1 ||
            p === totalPages ||
            (p >= page - 1 && p <= page + 1)
          )
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            if (prev && p - prev > 1) {
              return (
                <span key={`ellipsis-${p}`} className="px-2 text-gray-500">
                  …
                </span>
              );
            }
            return (
              <button
                key={p}
                className={`btn btn-sm ${
                  p === page ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}

        {/* Next */}
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
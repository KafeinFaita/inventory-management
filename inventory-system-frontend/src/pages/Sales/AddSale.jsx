// src/pages/Sales/AddSale.jsx
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "../../config";
import { generatePDF } from "../../utils/generatePDF";
import ConfirmModal from "../../components/ConfirmModal";

export default function AddSale() {
  const [products, setProducts] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [items, setItems] = useState([]); // empty cart by default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controls
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("alpha");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Brand/category options
  const brandOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );

  // Filter/sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .filter((p) => (filterBrand ? p.brand === filterBrand : true))
      .filter((p) => (filterCategory ? p.category === filterCategory : true))
      .sort((a, b) => {
        switch (sortBy) {
          case "priceAsc":
            return a.price - b.price;
          case "priceDesc":
            return b.price - a.price;
          case "alphaDesc":
            return b.name.localeCompare(a.name);
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, search, filterBrand, filterCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Add to cart
  const addSimpleProduct = (p) => {
    const existingIndex = items.findIndex((i) => i.product === p._id && (i.variants?.length || 0) === 0);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity = Math.min(updated[existingIndex].quantity + 1, p.stock ?? Infinity);
      setItems(updated);
    } else {
      setItems([...items, { product: p._id, quantity: 1, variants: [] }]);
    }
  };

  const addVariantProduct = (p, variantName) => {
    const existingIndex = items.findIndex(
      (i) => i.product === p._id && i.variants?.[0]?.option === variantName
    );
    const v = p.variants.find((vv) => vv.name === variantName);
    if (!v) return;

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity = Math.min(updated[existingIndex].quantity + 1, v.stock ?? Infinity);
      setItems(updated);
    } else {
      setItems([
        ...items,
        { product: p._id, quantity: 1, variants: [{ category: "Variant", option: variantName }] },
      ]);
    }
  };

  // Totals
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p._id === item.product);
      if (!prod) return sum;
      if (prod.hasVariants && item.variants?.length > 0) {
        const selectedName = item.variants[0]?.option;
        const variant = prod.variants.find((v) => v.name === selectedName);
        return sum + (variant?.price || 0) * item.quantity;
      }
      return sum + (prod.price || 0) * item.quantity;
    }, 0);
  };

  // Validate quantities
  const validateQuantities = () => {
    for (const item of items) {
      const product = products.find((p) => p._id === item.product);
      if (!product) continue;

      if (product.hasVariants && item.variants?.length > 0) {
        const selectedName = item.variants[0]?.option;
        const variant = product.variants.find((v) => v.name === selectedName);
        if (!variant) throw new Error(`Variant not found for ${product.name}`);
        if (item.quantity > variant.stock)
          throw new Error(
            `Not enough stock for ${product.name} (${variant.name}). Available: ${variant.stock}`
          );
      } else {
        if (item.quantity > product.stock)
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`
          );
      }
    }
  };

  // Pure submit logic
  const submitSale = async () => {
    setIsSubmitting(true);
    setMessage("");
    try {
      validateQuantities();

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");

      setMessage("✅ Sale recorded successfully!");
      setItems([]);
      fetchProducts();
      generatePDF(data);
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form wrapper
  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    submitSale();
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const updateQty = (index, delta) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);

    const prod = products.find((p) => p._id === updated[index].product);
    if (prod) {
      if (prod.hasVariants && updated[index].variants?.length > 0) {
        const selectedName = updated[index].variants[0]?.option;
        const variant = prod.variants.find((v) => v.name === selectedName);
        if (variant) updated[index].quantity = Math.min(updated[index].quantity, variant.stock);
      } else {
        updated[index].quantity = Math.min(updated[index].quantity, prod.stock);
      }
    }
    setItems(updated);
  };

  if (loading) return <div className="flex justify-center items-center h-64">
    <span className="loading loading-spinner loading-lg text-primary"></span>
    <span className="ml-3 text-lg text-gray-600">Loading products...</span>
  </div>;

  if (error) return (
    <div className="alert alert-error shadow-lg">
      <div className="flex items-center justify-between w-full">
        <span>{error}</span>
                <button className="btn btn-sm btn-primary ml-4" onClick={fetchProducts}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4">Add Sale</h1>

      {message && (
        <div
          className={`text-center font-semibold ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Product Catalog */}
        <div className="col-span-2">
          <h2 className="text-xl font-bold mb-2">Products</h2>

          {/* Controls */}
          <div className="overflow-x-auto mb-4 space-y-2">
            <div>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterBrand}
                onChange={(e) => {
                  setFilterBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-sm flex-shrink-0"
              >
                <option value="">All Brands</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-sm flex-shrink-0"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-sm flex-shrink-0"
              >
                <option value="alpha">Name (A–Z)</option>
                <option value="alphaDesc">Name (Z–A)</option>
                <option value="priceAsc">Price (Low → High)</option>
                <option value="priceDesc">Price (High → Low)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.length === 0 ? (
              <p className="text-center text-gray-500 col-span-full">
                No products found.
              </p>
            ) : (
              paginatedProducts.map((p) => {
                const totalVariantStock = p.hasVariants
                  ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                  : p.stock || 0;
                const lowestVariantPrice = p.hasVariants
                  ? Math.min(...p.variants.map((v) => v.price || 0))
                  : p.price || 0;

                return (
                  <div
                    key={p._id}
                    className="card bg-base-100 shadow hover:shadow-lg"
                  >
                    <div className="card-body">
                      <h3 className="card-title">{p.name}</h3>
                      {p.hasVariants ? (
                        <>
                          <p className="text-sm text-gray-500">
                            From ₱{lowestVariantPrice} • {totalVariantStock} in
                            stock
                          </p>
                          <label className="text-sm font-semibold mt-2">
                            Select Variant
                          </label>
                          <select
                            className="select select-bordered w-full mt-1"
                            onChange={(e) => {
                              const selected = p.variants.find(
                                (v) => v.name === e.target.value
                              );
                              if (selected) addVariantProduct(p, selected.name);
                              e.target.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Choose a variant
                            </option>
                            {p.variants.map((v) => (
                              <option
                                key={v.name}
                                value={v.name}
                                disabled={v.stock === 0}
                              >
                                {v.name} — ₱{v.price} (Stock: {v.stock})
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <p>₱{p.price}</p>
                          <span
                            className={`badge ${
                              p.stock > 0 ? "badge-success" : "badge-error"
                            }`}
                          >
                            {p.stock > 0
                              ? `${p.stock} in stock`
                              : "Out of stock"}
                          </span>
                          <button
                            className="btn btn-sm btn-primary mt-2"
                            disabled={p.stock === 0}
                            onClick={() => addSimpleProduct(p)}
                          >
                            Add
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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

        {/* Right: Cart */}
        <div className="bg-base-200 p-4 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold">Cart</h2>
          {items.length === 0 && <p className="text-gray-500">No items yet.</p>}
          {items.map((item, index) => {
            const prod = products.find((p) => p._id === item.product);
            const isVariant = prod?.hasVariants && item.variants?.length > 0;
            const variantName = isVariant ? item.variants[0]?.option : null;
            const variant = isVariant
              ? prod?.variants.find((v) => v.name === variantName)
              : null;
            const unitPrice = isVariant
              ? variant?.price || 0
              : prod?.price || 0;
            const maxStock = isVariant
              ? variant?.stock || 0
              : prod?.stock || 0;

            return (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {prod?.name || "Unknown"}{" "}
                    {variantName && `(${variantName})`}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₱{unitPrice} × {item.quantity}{" "}
                    {maxStock ? `(Stock: ${maxStock})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => updateQty(index, -1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => updateQty(index, 1)}
                    disabled={item.quantity >= maxStock}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error"
                    onClick={() => removeItem(index)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}

          <div className="text-right font-bold text-lg">
            Total: ₱{calculateTotal().toLocaleString()}
          </div>

                    <button
            type="button"
            className={`btn btn-primary w-full ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting || items.length === 0}
            onClick={() => setShowConfirm(true)}
          >
            {isSubmitting ? "Recording Sale..." : "Record Sale"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        show={showConfirm}
        title="Confirm Sale"
        message="Are you sure you want to record this sale? This action cannot be undone."
        confirmText="Yes, Record Sale"
        cancelText="Cancel"
        onConfirm={submitSale}   // 🔑 call pure logic, no event needed
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
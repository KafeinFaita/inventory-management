import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";

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
  }, []);

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
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch products." });
    }
  };

  const fetchBrands = async (api) => {
    try {
      const res = await api.get("/brands");
      setBrands(res.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch brands." });
    }
  };

  const fetchCategories = async (api) => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
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

      {message && (
        <div
          ref={messageRef}
          className={`alert shadow-lg transition-all duration-300 ${
            message.type === "error" ? "alert-error" : "alert-success"
          }`}
        >
          <span>{message.text}</span>
          {message.type === "error" && (
            <button
              className="btn btn-sm btn-primary ml-4"
              onClick={fetchAllData}
            >
              Retry
            </button>
          )}
        </div>
      )}

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

      <InventoryTable
        products={products}
        loading={loading}
        expandedRows={expandedRows}
        toggleRow={toggleRow}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </div>
  );
}
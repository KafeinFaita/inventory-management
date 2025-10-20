import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function PurchaseOrder() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal state
  const [selectedPO, setSelectedPO] = useState(null);

  const getApi = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: `${API_URL}/api`,
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const api = getApi();
      const res = await api.get("/purchase-orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch purchase orders." });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const api = getApi();
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const api = getApi();
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    setItems([...items, { product: "", variant: "", quantity: 1, unitCost: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const api = getApi();
    const payload = {
      supplier,
      items: items.map(i => ({
        product: i.product,
        variant: i.variant || undefined,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        subtotal: Number(i.quantity) * Number(i.unitCost),
      })),
      notes,
      totalAmount: items.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.unitCost),
        0
      ),
    };

    try {
      await api.post("/purchase-orders", payload);
      setMessage({ type: "success", text: "Purchase Order created successfully!" });
      setSupplier("");
      setItems([]);
      setNotes("");
      fetchOrders();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to create PO.";
      setMessage({ type: "error", text: backendMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // 🔧 New helper for status updates
  const updateStatus = async (id, newStatus) => {
    try {
      const api = getApi();
      await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      setMessage({ type: "success", text: `PO marked as ${newStatus}!` });
      setSelectedPO(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.error || "Failed to update status.";
      setMessage({ type: "error", text: backendMsg });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Purchase Orders</h1>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      {/* Create PO Form */}
      <form className="space-y-4 bg-base-200 p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">New Purchase Order</h2>

        {/* Supplier */}
        <div>
          <label className="block font-semibold mb-1">Supplier</label>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div>
          <label className="block font-semibold mb-1">Items</label>
          <div className="grid grid-cols-5 gap-2 font-semibold mb-1">
            <span>Product</span>
            <span>Variant</span>
            <span>Qty</span>
            <span>Unit Cost</span>
            <span></span>
          </div>

          {items.map((item, index) => {
            const selectedProduct = products.find(p => p._id === item.product);
            return (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                {/* Product */}
                <select
                  value={item.product}
                  onChange={e => {
                    updateItem(index, "product", e.target.value);
                    updateItem(index, "variant", "");
                  }}
                  className="select select-bordered"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>

                {/* Variant */}
                {selectedProduct?.variants?.length > 0 ? (
                  <select
                    value={item.variant}
                    onChange={e => updateItem(index, "variant", e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select variant</option>
                    {selectedProduct.variants.map((v, idx) => (
                      <option key={idx} value={v.name}>
                        {v.name} {v.sku ? `(${v.sku})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-500 self-center">No variants</span>
                )}

                {/* Quantity */}
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(index, "quantity", e.target.value)}
                  className="input input-bordered"
                  placeholder="Qty"
                />

                {/* Unit cost */}
                <input
                  type="number"
                  min="0"
                  value={item.unitCost}
                  onChange={e => updateItem(index, "unitCost", e.target.value)}
                  className="input input-bordered"
                  placeholder="Unit Cost"
                />

                {/* Remove */}
                <button type="button" className="btn btn-error" onClick={() => removeItem(index)}>X</button>
              </div>
            );
          })}

          <button type="button" className="btn btn-sm btn-secondary mt-2" onClick={addItem}>
            + Add Item
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="textarea textarea-bordered w-full"
          />
        </div>

        <button type="submit" className={`btn btn-primary ${submitting ? "loading" : ""}`}>
          Create PO
        </button>
      </form>

      {/* Orders Table */}
      <div className="overflow-x-auto bg-base-200 p-6 rounded-lg shadow mt-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner text-primary loading-lg"></span>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.poNumber}</td>
                  <td>{o.supplier?.name}</td>
                  <td>{o.status}</td>
                  <td>{o.totalAmount}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => setSelectedPO(o)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for PO Details */}
      {selectedPO && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative">
            <button
              className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
              onClick={() => setSelectedPO(null)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Purchase Order {selectedPO.poNumber}
            </h2>

            <p><strong>Supplier:</strong> {selectedPO.supplier?.name}</p>
            <p><strong>Status:</strong> {selectedPO.status}</p>
            <p><strong>Total:</strong> {selectedPO.totalAmount}</p>
            <p><strong>Created:</strong> {new Date(selectedPO.createdAt).toLocaleDateString()}</p>
            {selectedPO.notes && (
              <p className="mt-2"><strong>Notes:</strong> {selectedPO.notes}</p>
            )}

            <h3 className="font-semibold mt-4 mb-2">Line Items</h3>
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedPO.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product?.name || it.productName}</td>
                    <td>{it.variant || "—"}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unitCost}</td>
                    <td>{it.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🔧 Lifecycle Action Buttons */}
            <div className="flex gap-2 mt-4">
              {selectedPO.status === "draft" && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => updateStatus(selectedPO._id, "ordered")}
                  >
                    Mark as Ordered
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => updateStatus(selectedPO._id, "cancelled")}
                  >
                    Cancel PO
                  </button>
                </>
              )}

              {selectedPO.status === "ordered" && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => updateStatus(selectedPO._id, "received")}
                  >
                    Mark as Received
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => updateStatus(selectedPO._id, "cancelled")}
                  >
                    Cancel PO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
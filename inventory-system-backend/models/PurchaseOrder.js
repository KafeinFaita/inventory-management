import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

// 🔁 Valid lifecycle transitions
export const validTransitions = {
  draft: ["ordered", "cancelled"],
  ordered: ["received", "cancelled"],
  received: [],
  cancelled: []
};

// 🧾 Line item schema
const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String },
    variant: { type: String },
    variantSnapshot: { type: Object },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// 📜 Status history schema
const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

// 📦 Purchase Order schema
const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    orderDate: { type: Date, default: Date.now },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "ordered", "received", "cancelled"],
      default: "draft",
    },
    items: [lineItemSchema],
    notes: { type: String },
    totalAmount: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    statusHistory: [statusHistorySchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🔢 Auto-generate sequential PO number
purchaseOrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.poNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("PurchaseOrder").countDocuments({
      poNumber: new RegExp(`^PO-${year}-`),
    });
    this.poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// ✅ Apply soft delete plugin
purchaseOrderSchema.plugin(safeDeletePlugin);

// 📌 Useful indexes
purchaseOrderSchema.index({ active: 1 });
purchaseOrderSchema.index({ poNumber: 1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
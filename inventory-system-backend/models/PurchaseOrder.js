import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

// models/PurchaseOrder.js
export const validTransitions = {
  draft: ["ordered", "cancelled"],
  ordered: ["received", "cancelled"],
  received: [],
  cancelled: []
};

const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String }, // snapshot of product name at order time

    // ✅ Variant reference by name (not ObjectId)
    variant: { type: String }, // e.g. "Red - M"
    variantSnapshot: { type: Object }, // optional snapshot of attributes (size, color, etc.)

    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

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
    active: { type: Boolean, default: true }, // required for safeDelete
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

// Useful indexes
purchaseOrderSchema.index({ active: 1 });
purchaseOrderSchema.index({ poNumber: 1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
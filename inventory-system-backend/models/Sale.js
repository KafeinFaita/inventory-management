// models/Sale.js
import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtSale: {
    type: Number,
    required: true,
  },
  variants: [
    {
      category: { type: String, required: true }, // e.g., "Color"
      option: { type: String, required: true },   // e.g., "Red"
    },
  ],
});

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [saleItemSchema],

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // 🧾 Invoice-related fields
    invoiceNumber: {
      type: String
    },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ Auto-calc total before save
saleSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.priceAtSale * item.quantity,
    0
  );
  next();
});

// ✅ Auto-generate invoice number if not set
saleSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    const timestamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `INV-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// ✅ Apply safe delete plugin
saleSchema.plugin(safeDeletePlugin);

// ✅ Useful indexes
saleSchema.index({ user: 1, active: 1 }); // fast lookups by user
saleSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
saleSchema.index({ date: -1 }); // efficient sorting by most recent sales
saleSchema.index({ active: 1 }); // quick filtering for active sales

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
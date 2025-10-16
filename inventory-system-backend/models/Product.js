// models/Product.js
import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Red - M" or "256GB Black"
    attributes: { type: Object, default: {} }, // flexible: color, size, etc.
    stock: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    // optional: add active flag if you want per-variant control
    // active: { type: Boolean, default: true },
  },
  { _id: false } // prevent creating extra _id for each variant
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    brand: { type: String },
    category: { type: String },

    // Stock & pricing
    stock: {
      type: Number,
      default: 0,
      required: function () {
        return !this.hasVariants; // only required if no variants
      },
      min: 0,
    },
    price: {
      type: Number,
      required: function () {
        return !this.hasVariants; // only required if no variants
      },
      min: 0,
    },

    // Variants
    hasVariants: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ Apply safe delete plugin
productSchema.plugin(safeDeletePlugin);

// ✅ Useful indexes
productSchema.index({ active: 1 }); // fast filtering for active products
productSchema.index({ category: 1, active: 1 }); // common query: active products by category
productSchema.index({ brand: 1, active: 1 }); // common query: active products by brand
productSchema.index({ createdAt: -1 }); // efficient sorting by newest

const Product = mongoose.model("Product", productSchema);

export default Product;
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Red - M" or "256GB Black"
  attributes: { type: Object, default: {} }, // flexible: color, size, etc.
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
}, { _id: false }); // prevent creating extra _id for each variant

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: String,
    category: String,
    stock: { type: Number, default: 0 }, // used if no variants
    price: { type: Number, required: true }, // base price if no variants
    hasVariants: { type: Boolean, default: false }, // new field
    variants: { type: [variantSchema], default: [] }, // new field
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

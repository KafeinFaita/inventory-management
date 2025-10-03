import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  category: String,
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
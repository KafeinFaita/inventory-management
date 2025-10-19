import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  notes: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

supplierSchema.plugin(safeDeletePlugin);
supplierSchema.index({ active: 1 });
supplierSchema.index({ name: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
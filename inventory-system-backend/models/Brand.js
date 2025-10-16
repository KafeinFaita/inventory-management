import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // avoids duplicates like "Nike " vs "Nike"
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

// ✅ Apply safe delete plugin
brandSchema.plugin(safeDeletePlugin);

// ✅ Useful indexes
brandSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
brandSchema.index({ active: 1 });

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
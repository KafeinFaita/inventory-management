// models/Category.js
import mongoose from "mongoose";
import safeDeletePlugin from "../plugins/safeDelete.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true, // ✅ avoids duplicates like "Shoes " vs "Shoes"
    },
  },
  { timestamps: true }
);

// ✅ Apply safe delete plugin
categorySchema.plugin(safeDeletePlugin);

// ✅ Useful indexes
categorySchema.index({ active: 1 }); // quick filtering for active categories

const Category = mongoose.model("Category", categorySchema);

export default Category;
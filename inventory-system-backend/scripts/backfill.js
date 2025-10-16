// scripts/backfillActive.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const results = {};

    results.products = await Product.updateMany(
      { active: { $exists: false } },
      { $set: { active: true, deletedAt: null } }
    );

    results.categories = await Category.updateMany(
      { active: { $exists: false } },
      { $set: { active: true, deletedAt: null } }
    );

    results.brands = await Brand.updateMany(
      { active: { $exists: false } },
      { $set: { active: true, deletedAt: null } }
    );

    console.log("✅ Backfill complete:");
    console.log(`Products updated: ${results.products.modifiedCount}`);
    console.log(`Categories updated: ${results.categories.modifiedCount}`);
    console.log(`Brands updated: ${results.brands.modifiedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
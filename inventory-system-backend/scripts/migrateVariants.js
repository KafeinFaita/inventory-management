// scripts/migrateVariantNames.js
import mongoose from "mongoose";
import Product from "../models/Product.js"; // adjust path
import dotenv from "dotenv";
dotenv.config();


const toName = (attributes = {}) => {
  const parts = Object.entries(attributes)
    .filter(([, val]) => val != null && String(val).trim() !== "")
    .map(([, val]) => String(val));
  return parts.length ? parts.join(" - ") : "Variant";
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({ hasVariants: true });

  for (const product of products) {
    let updated = false;
    product.variants.forEach((variant) => {
      if (!variant.name) {
        variant.name = toName(variant.attributes);
        updated = true;
      }
    });
    if (updated) {
      await product.save();
      console.log(`Updated: ${product.name}`);
    }
  }

  console.log("Migration complete");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
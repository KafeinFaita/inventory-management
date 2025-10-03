// routes/dashboardRoutes.js
import express from "express";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalBrands = await Brand.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Low-stock alert: products with stock <= 5
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select(
      "name stock"
    );

    res.json({
      totalProducts,
      totalBrands,
      totalCategories,
      lowStockProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

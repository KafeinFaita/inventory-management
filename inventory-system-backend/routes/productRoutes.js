import express from "express";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all products (admin + staff can view)
router.get("/", protect, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      stock,
      price,
      hasVariants = false,
      variants = [],
    } = req.body;

    // ✅ Validate variants only if hasVariants = true
    if (hasVariants && (!Array.isArray(variants) || variants.length === 0)) {
      return res
        .status(400)
        .json({ error: "Variants must be provided when hasVariants is true." });
    }

    const product = new Product({
      name,
      brand,
      category,
      stock: hasVariants ? 0 : stock, // stock handled by variants if enabled
      price: hasVariants ? 0 : price, // price handled by variants if enabled
      hasVariants,
      variants,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      stock,
      price,
      hasVariants = false,
      variants = [],
    } = req.body;

    // Validate variants if needed
    if (hasVariants && (!Array.isArray(variants) || variants.length === 0)) {
      return res
        .status(400)
        .json({ error: "Variants must be provided when hasVariants is true." });
    }

    const updatedData = {
      name,
      brand,
      category,
      stock: hasVariants ? 0 : stock,
      price: hasVariants ? 0 : price,
      hasVariants,
      variants,
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

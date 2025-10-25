// routes/productRoutes.js
import express from "express";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateProduct, validateRequest } from "../middleware/validator.js";

const router = express.Router();

// Utility: build a consistent variant name from attributes
const buildVariantName = (variant) => {
  if (variant.name && variant.name.trim() !== "") return variant.name;
  if (variant.attributes && Object.keys(variant.attributes).length > 0) {
    // Sort keys alphabetically for consistent ordering
    const parts = Object.keys(variant.attributes)
      .sort()
      .map((key) => String(variant.attributes[key]));
    return parts.join(" - ");
  }
  return "Variant";
};

/* =========================================================
   GET ALL PRODUCTS (admin + staff)
   Only return active products
========================================================= */
router.get("/", protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      brand = "",
      category = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 20);

    const filter = { active: true };
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { brand: regex }, { category: regex }];
    }
    if (brand) filter.brand = brand;
    if (category) filter.category = category;

    const sortDir = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortDir };

    const [data, totalItems] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      pageSize: limitNum,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   CREATE PRODUCT (admin only)
========================================================= */
router.post(
  "/",
  protect,
  adminOnly,
  validateProduct,
  validateRequest,
  async (req, res, next) => {
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

      if (hasVariants && (!Array.isArray(variants) || variants.length === 0)) {
        res.status(400);
        return next(new Error("Variants must be provided when hasVariants is true."));
      }

      const normalizedVariants = hasVariants
        ? variants.map((v) => ({
            ...v,
            name: buildVariantName(v),
          }))
        : [];

      // CREATE PRODUCT
      const product = new Product({
        name,
        brand,
        category,
        hasVariants,
        variants: normalizedVariants,
        ...(hasVariants
          ? {} // ✅ don’t set parent stock/price
          : { stock, price }),
      });

      await product.save();
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);
/* =========================================================
   UPDATE PRODUCT (admin only)
   Prevent updates to inactive products
========================================================= */
router.put(
  "/:id",
  protect,
  adminOnly,
  validateProduct,
  validateRequest,
  async (req, res, next) => {
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

      if (hasVariants && (!Array.isArray(variants) || variants.length === 0)) {
        res.status(400);
        return next(new Error("Variants must be provided when hasVariants is true."));
      }

      const normalizedVariants = hasVariants
        ? variants.map((v) => ({
            ...v,
            name: buildVariantName(v),
          }))
        : [];

      const product = await Product.findById(req.params.id);
      if (!product || !product.active) {
        res.status(404);
        return next(new Error("Product not found or inactive"));
      }

      product.name = name;
      product.brand = brand;
      product.category = category;
      product.hasVariants = hasVariants;
      product.variants = normalizedVariants;

      if (hasVariants) {
        // ✅ clear parent stock/price so they don’t trigger validation
        product.stock = undefined;
        product.price = undefined;
      } else {
        product.stock = stock;
        product.price = price;
      }

      await product.save();
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

/* =========================================================
   DELETE PRODUCT (admin only)
   Soft delete instead of hard remove
========================================================= */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.safeDelete();

    res.json({ message: "Product deactivated (soft deleted) successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
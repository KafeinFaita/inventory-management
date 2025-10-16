import express from "express";
import Category from "../models/Category.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const validateCategory = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
];

// GET all categories (active only)
router.get("/", protect, async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// CREATE category
router.post(
  "/",
  protect,
  adminOnly,
  validateCategory,
  validateRequest,
  async (req, res, next) => {
    try {
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
      });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE category
router.put(
  "/:id",
  protect,
  adminOnly,
  validateCategory,
  validateRequest,
  async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category || !category.active) {
        res.status(404);
        return next(new Error("Category not found or inactive"));
      }
      category.name = req.body.name;
      category.description = req.body.description;
      await category.save();
      res.json(category);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE category (soft delete)
router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      return next(new Error("Category not found"));
    }
    await category.safeDelete();
    res.json({ message: "Category deactivated successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
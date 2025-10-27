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

// GET categories (active only, with search/sort/pagination)
router.get("/", protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    // Build filter
    const filter = { active: true };
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }];
      // If you add description to Category schema, include { description: regex }
    }

    // Sorting
    const sortDir = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortDir };

    // Query + count
    const [data, totalItems] = await Promise.all([
      Category.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Category.countDocuments(filter),
    ]);

    res.json({
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      pageSize: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET all categories (no pagination, active only)
router.get("/all", protect, async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true })
      .sort("name")
      .lean();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// CREATE category
router.post("/", protect, adminOnly, validateCategory, validateRequest, async (req, res, next) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error(`Category "${req.body.name}" already exists`));
    }
    next(err);
  }
});

// UPDATE category
router.put("/:id", protect, adminOnly, validateCategory, validateRequest, async (req, res, next) => {
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
    if (err.code === 11000) {
      res.status(400);
      return next(new Error(`Category "${req.body.name}" already exists`));
    }
    next(err);
  }
});

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
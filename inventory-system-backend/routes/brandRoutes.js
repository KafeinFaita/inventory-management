import express from "express";
import Brand from "../models/Brand.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const validateBrand = [
  body("name").trim().notEmpty().withMessage("Brand name is required"),
];

// GET brands (active only, with search/sort/pagination)
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
      filter.$or = [
        { name: regex },
        { description: regex },
      ];
    }

    // Sorting
    const sortDir = order === "asc" ? 1 : -1;
    const sortObj = { [sort]: sortDir };

    // Query + count
    const [data, totalItems] = await Promise.all([
      Brand.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Brand.countDocuments(filter),
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

// GET all brands (no pagination, active only)
router.get("/all", protect, async (req, res, next) => {
  try {
    const brands = await Brand.find({ active: true }).sort("name").lean();
    res.json(brands);
  } catch (err) {
    next(err);
  }
});

// CREATE brand
router.post("/", protect, adminOnly, validateBrand, validateRequest, async (req, res, next) => {
  try {
    const brand = new Brand({
      name: req.body.name,
      description: req.body.description,
    });
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    if (err.code === 11000) {
      // Check if the duplicate is an inactive brand
      const existing = await Brand.findOne({ name: req.body.name }).collation({ locale: "en", strength: 2 });
      if (existing && !existing.active) {
        res.status(400);
        return next(new Error(`Brand "${req.body.name}" already exists but is inactive. You can restore it instead of creating a new one.`));
      }
      res.status(400);
      return next(new Error("Brand name already exists"));
    }
    next(err);
  }
});

// UPDATE brand
router.put(
  "/:id",
  protect,
  adminOnly,
  validateBrand,
  validateRequest,
  async (req, res, next) => {
    try {
      const brand = await Brand.findById(req.params.id);
      if (!brand) {
        res.status(404);
        return next(new Error("Brand not found"));
      }
      brand.name = req.body.name;
      brand.description = req.body.description;
      await brand.save();
      res.json(brand);
    } catch (err) {
      if (err.code === 11000) {
        res.status(400);
        return next(new Error("Brand name already exists"));
      }
      next(err);
    }
  }
);

// DELETE brand (soft delete)
router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      return next(new Error("Brand not found"));
    }
    await brand.safeDelete();
    res.json({ message: "Brand deactivated successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
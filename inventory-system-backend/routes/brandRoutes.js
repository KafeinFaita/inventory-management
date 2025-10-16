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

// GET all brands (active only)
router.get("/", protect, async (req, res, next) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    next(err);
  }
});

// CREATE brand
router.post(
  "/",
  protect,
  adminOnly,
  validateBrand,
  validateRequest,
  async (req, res, next) => {
    try {
      const brand = new Brand({
        name: req.body.name,
        description: req.body.description,
      });
      await brand.save();
      res.status(201).json(brand);
    } catch (err) {
      next(err);
    }
  }
);

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
      if (!brand || !brand.active) {
        res.status(404);
        return next(new Error("Brand not found or inactive"));
      }
      brand.name = req.body.name;
      brand.description = req.body.description;
      await brand.save();
      res.json(brand);
    } catch (err) {
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
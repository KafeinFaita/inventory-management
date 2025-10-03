import express from "express";
import Brand from "../models/Brand.js";

const router = express.Router();

// Get all brands
router.get("/", async (req, res) => {
  const brands = await Brand.find();
  res.json(brands);
});

// Create brand
router.post("/", async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update brand
router.put("/:id", async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(brand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete brand
router.delete("/:id", async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: "Brand deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

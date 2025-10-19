import express from "express";
import Supplier from "../models/Supplier.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all active suppliers
router.get("/", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ active: true });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE supplier
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE supplier
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.active) return res.status(404).json({ error: "Supplier not found or inactive" });

    Object.assign(supplier, req.body);
    await supplier.save();
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supplier (soft delete)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    await supplier.safeDelete();
    res.json({ message: "Supplier deactivated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
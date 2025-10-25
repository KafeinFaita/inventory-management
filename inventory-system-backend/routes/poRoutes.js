import express from "express";
import PurchaseOrder, { validTransitions } from "../models/PurchaseOrder.js";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   GET ALL PURCHASE ORDERS (admin + staff)
========================================================= */
router.get("/", protect, async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({ active: true })
      .populate("supplier")
      .populate("items.product")
      .populate("statusHistory.changedBy");
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   CREATE PURCHASE ORDER (admin only)
========================================================= */
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { supplier, items, notes, totalAmount } = req.body;

    // Validate each line item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: "Invalid product selected." });
      }

      if (product.hasVariants) {
        if (!item.variant) {
          return res.status(400).json({
            error: `Product "${product.name}" requires a variant.`,
          });
        }
        const variantExists = product.variants.some(v => v.name === item.variant);
        if (!variantExists) {
          return res.status(400).json({
            error: `Variant "${item.variant}" does not belong to product "${product.name}".`,
          });
        }
      } else {
        if (item.variant) {
          return res.status(400).json({
            error: `Product "${product.name}" has no variants, but a variant was provided.`,
          });
        }
      }
    }

    const po = new PurchaseOrder({ supplier, items, notes, totalAmount });
    await po.save();
    res.status(201).json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   UPDATE PURCHASE ORDER (admin only)
   Only editable while in draft
========================================================= */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po || !po.active) {
      return res.status(404).json({ error: "Purchase Order not found or inactive" });
    }

    if (po.status !== "draft") {
      return res.status(400).json({ error: "Only draft POs can be edited" });
    }

    // Only allow safe fields to be updated
    const { supplier, items, notes, totalAmount } = req.body;
    if (supplier) po.supplier = supplier;
    if (items) po.items = items;
    if (notes !== undefined) po.notes = notes;
    if (totalAmount !== undefined) po.totalAmount = totalAmount;

    await po.save();
    res.json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =========================================================
   UPDATE STATUS (admin only)
   Enforces lifecycle transitions
========================================================= */
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id).populate("items.product");
    if (!po || !po.active) {
      return res.status(404).json({ error: "Purchase Order not found or inactive" });
    }

    const allowed = validTransitions[po.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid transition: cannot move from ${po.status} to ${status}`,
      });
    }

    // ✅ Log the transition
    po.statusHistory.push({
      from: po.status,
      to: status,
      changedBy: req.user._id,
      changedAt: new Date()
    });

    // ✅ Update stock if received
    if (status === "received") {
      for (const item of po.items) {
        const product = await Product.findById(item.product._id);
        if (!product) continue;

        if (product.hasVariants && item.variant) {
          const variant = product.variants.find(v => v.name === item.variant);
          if (variant) variant.stock += item.quantity;
        } else {
          product.stock += item.quantity;
        }
        await product.save();
      }
      po.receivedDate = new Date();
      po.receivedBy = req.user._id;
    }

    po.status = status;
    await po.save();

    res.json({ message: `PO marked as ${status}`, po });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
/* =========================================================
   DELETE PURCHASE ORDER (admin only)
   Soft delete instead of hard remove
========================================================= */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: "Purchase Order not found" });

    await po.safeDelete();
    res.json({ message: "Purchase Order deactivated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
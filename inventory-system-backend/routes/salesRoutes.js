import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all sales (admin + staff can view)
router.get("/", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user", "name email role")
      .populate("items.product", "name price");
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create sale (admin or staff)
router.post("/", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No sale items provided" });
    }

    // Populate priceAtSale and check stock
    const itemsWithPrice = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Product not found: ${item.product}`);

        if (product.stock < item.quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`
          );
        }

        return {
          product: item.product,
          quantity: item.quantity,
          priceAtSale: product.price,
        };
      })
    );

    // Deduct stock
    for (const item of itemsWithPrice) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create sale
    const sale = new Sale({
      user: req.user._id, // assign logged-in user automatically
      items: itemsWithPrice,
    });

    await sale.save();

    // Populate before sending back
    const savedSale = await Sale.findById(sale._id)
      .populate("user", "name email role")
      .populate("items.product", "name price");

    res.status(201).json(savedSale);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

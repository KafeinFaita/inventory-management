// routes/salesRoutes.js
import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

const router = express.Router();

// Create a new sale
router.post("/", async (req, res) => {
  try {
    const { items } = req.body; // [{ product: id, quantity: number }]

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Fetch products and build sale items
    const saleItems = [];
    for (const { product, quantity } of items) {
      const prod = await Product.findById(product);
      if (!prod) return res.status(404).json({ error: "Product not found" });
      if (prod.stock < quantity)
        return res.status(400).json({ error: `Not enough stock for ${prod.name}` });

      // Decrease stock
      prod.stock -= quantity;
      await prod.save();

      saleItems.push({
        product: prod._id,
        quantity,
        priceAtSale: prod.price,
      });
    }

    // Save sale
    const newSale = new Sale({ items: saleItems });
    await newSale.save();

    res.status(201).json(newSale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().populate("items.product", "name price");
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

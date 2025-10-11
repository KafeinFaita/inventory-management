// routes/salesRoutes.js
import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   GET ALL SALES (admin + staff)
========================================================= */
router.get("/", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user", "name email role")
      .populate("items.product", "name price");
    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

/* =========================================================
   CREATE SALE (admin + staff)
   - sanitizes incoming data to avoid invalid createdAt/date
   - checks stock, deducts stock, snapshots priceAtSale
   - generates invoiceNumber safely using start/end-of-day counting
========================================================= */
router.post("/", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    // Defensive: remove incoming dates so timestamps/defaults apply
    if ("createdAt" in req.body) delete req.body.createdAt;
    if ("date" in req.body) delete req.body.date;

    const { items, customerName, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No sale items provided" });
    }

    const itemsWithPrice = [];

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({ error: "Sale item missing product id" });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: "Invalid item quantity" });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.product}` });
      }

      // --- Handle variant products ---
      if (product.hasVariants) {
        if (!item.variants || item.variants.length === 0) {
          return res.status(400).json({ error: `Product ${product.name} requires variant selection.` });
        }

        // Validate submitted variants exist in product
        for (const v of item.variants) {
          const category = product.variants.find(cat => cat.category === v.category);
          if (!category) {
            return res.status(400).json({ error: `Invalid variant category: ${v.category}` });
          }
          if (!category.options.includes(v.option)) {
            return res.status(400).json({ error: `Invalid variant option for ${v.category}: ${v.option}` });
          }
        }

        // Deduct stock at variant level
        for (const v of item.variants) {
          const category = product.variants.find(cat => cat.category === v.category);
          const optionIndex = category.options.findIndex(opt => opt === v.option);
          if (!category.stock) category.stock = Array(category.options.length).fill(product.stock || 0);
          if (category.stock[optionIndex] < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${product.name} (${v.category}: ${v.option}). Available: ${category.stock[optionIndex]}`
            });
          }
          category.stock[optionIndex] -= item.quantity;
        }

        await product.save();
      } else {
        // --- Non-variant products ---
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }
        product.stock -= item.quantity;
        await product.save();
      }

      itemsWithPrice.push({
        product: product._id,
        quantity: item.quantity,
        priceAtSale: product.price,
        variants: item.variants || [],
      });
    }

    // --- Generate invoiceNumber ---
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const saleCountToday = await Sale.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const datePart = now.toISOString().split("T")[0].replace(/-/g, "");
    const invoiceNumber = `INV-${datePart}-${(saleCountToday + 1).toString().padStart(3, "0")}`;

    // --- Create sale document ---
    const sale = new Sale({
      user: req.user._id,
      items: itemsWithPrice,
      customerName: customerName || "Walk-in Customer",
      paymentMethod: paymentMethod || "cash",
      invoiceNumber,
    });

    await sale.save();

    // Populate for frontend
    const savedSale = await Sale.findById(sale._id)
      .populate("user", "name email role")
      .populate("items.product", "name price brand");

    res.status(201).json(savedSale);
  } catch (err) {
    console.error("Error creating sale:", err);

    if (err.message && /Insufficient stock|not found|Invalid/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || "Server error while creating sale." });
  }
});

/* =========================================================
   GET SINGLE SALE INVOICE DATA
   (admin + staff allowed; both can generate)
========================================================= */
router.get("/:id/invoice", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("user", "name email role")
      .populate("items.product", "name price brand");

    if (!sale) return res.status(404).json({ error: "Sale not found" });

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      date: sale.createdAt,
      customerName: sale.customerName,
      paymentMethod: sale.paymentMethod,
      user: sale.user,
      items: sale.items.map((i) => ({
        name: i.product?.name || i.product, // fallback if not populated
        brand: i.product?.brand || undefined,
        quantity: i.quantity,
        priceAtSale: i.priceAtSale,
        subtotal: i.priceAtSale * i.quantity,
      })),
      totalAmount: sale.totalAmount,
    };

    res.json(invoiceData);
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

export default router;

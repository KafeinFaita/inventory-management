// routes/salesRoutes.js
import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { Parser } from "json2csv";
import { validateSale } from "../middleware/validator.js";
import { validateRequest } from "../middleware/validator.js";


const router = express.Router();

/* =========================================================
   GET ALL SALES (admin + staff)
   Only return active sales by default
========================================================= */
router.get("/", protect, async (req, res) => {
  try {
    let { start, end, staff, category, brand, product } = req.query;

    const normalize = (val) =>
      val && val !== "undefined" && val !== "null" && val !== "" ? val : null;

    staff = normalize(staff);
    product = normalize(product);
    brand = normalize(brand);
    category = normalize(category);

    const query = { active: true }; // ✅ only active sales
    if (start || end) {
      query.createdAt = {};
      if (start) query.createdAt.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    if (staff) query.user = staff;
    if (product) query["items.product"] = product;

    let sales = await Sale.find(query)
      .populate("user", "name email")
      .populate("items.product", "name brand category");

    if (brand) {
      sales = sales.filter((s) =>
        s.items.some(
          (i) => i.product?.brand?.toLowerCase() === brand.toLowerCase()
        )
      );
    }
    if (category) {
      sales = sales.filter((s) =>
        s.items.some(
          (i) => i.product?.category?.toLowerCase() === category.toLowerCase()
        )
      );
    }

    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

/* =========================================================
   EXPORT SALES REPORT (CSV with filters)
   Admin only
========================================================= */
router.get("/export", protect, allowRoles("admin"), async (req, res) => {
  try {
    let { start, end, staff, category, brand, product, sort, order } = req.query;

    const normalize = (val) =>
      val && val !== "undefined" && val !== "null" && val !== "" ? val : null;

    staff = normalize(staff);
    product = normalize(product);
    brand = normalize(brand);
    category = normalize(category);

    const query = { active: true }; // ✅ only active sales
    if (start || end) {
      query.createdAt = {};
      if (start) query.createdAt.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    if (staff) query.user = staff;
    if (product) query["items.product"] = product;

    let sales = await Sale.find(query)
      .populate("user", "name email")
      .populate("items.product", "name brand category");

    if (brand) {
      sales = sales.filter((s) =>
        s.items.some(
          (i) => i.product?.brand?.toLowerCase() === brand.toLowerCase()
        )
      );
    }
    if (category) {
      sales = sales.filter((s) =>
        s.items.some(
          (i) => i.product?.category?.toLowerCase() === category.toLowerCase()
        )
      );
    }

    if (sort) {
      const dir = order === "asc" ? 1 : -1;
      sales.sort((a, b) => {
        if (sort === "date") return (a.createdAt - b.createdAt) * dir;
        if (sort === "amount") return (a.totalAmount - b.totalAmount) * dir;
        if (sort === "staff")
          return (a.user?.name || "").localeCompare(b.user?.name || "") * dir;
        return 0;
      });
    }

    const rows = sales.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      date: s.createdAt.toISOString(),
      staff: s.user?.name || "Unknown",
      customer: s.customerName || "Walk-in",
      totalAmount: s.totalAmount,
      items: s.items
        .map((i) => {
          const variantLabel =
            i.variants && i.variants.length > 0
              ? ` (${i.variants.map((v) => v.option).join(", ")})`
              : "";
          return `${i.product?.name || "N/A"}${variantLabel} x${i.quantity}`;
        })
        .join("; "),
      brands: [
        ...new Set(s.items.map((i) => i.product?.brand).filter(Boolean)),
      ].join(", "),
      categories: [
        ...new Set(s.items.map((i) => i.product?.category).filter(Boolean)),
      ].join(", "),
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("sales-report.csv");
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting sales:", err);
    res.status(500).json({ error: "Failed to export sales report" });
  }
});

/* =========================================================
   CREATE SALE (admin + staff)
========================================================= */
router.post("/",
  protect,
  allowRoles("admin", "staff"),
  validateSale(),
  validateRequest, async (req, res) => {
  try {
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

      if (product.hasVariants) {
        if (!item.variants || item.variants.length === 0) {
          return res.status(400).json({ error: `Product ${product.name} requires variant selection.` });
        }

        const selectedName = item.variants[0]?.option;
        const variant = product.variants.find((v) => v.name === selectedName);

        if (!variant) {
          return res.status(400).json({ error: `Invalid variant selection for ${product.name}: ${selectedName}` });
        }

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stock}`,
          });
        }

        variant.stock -= item.quantity;
        await product.save();

        itemsWithPrice.push({
          product: product._id,
          quantity: item.quantity,
          priceAtSale: variant.price,
          variants: item.variants || [],
        });
      } else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
        }
        product.stock -= item.quantity;
        await product.save();

        itemsWithPrice.push({
          product: product._id,
          quantity: item.quantity,
          priceAtSale: product.price,
          variants: [],
        });
      }
    }

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

    const sale = new Sale({
      user: req.user._id,
      items: itemsWithPrice,
      customerName: customerName || "Walk-in Customer",
      paymentMethod: paymentMethod || "cash",
      invoiceNumber,
    });

    await sale.save();

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
========================================================= */
router.get("/:id/invoice", protect, allowRoles("admin", "staff"), async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, active: true })
      .populate("user", "name email role")
      .populate("items.product", "name price brand");

    if (!sale) return res.status(404).json({ error: "Sale not found or inactive" });

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      date: sale.createdAt,
      customerName: sale.customerName,
      paymentMethod: sale.paymentMethod,
      user: sale.user,
      items: sale.items.map((i) => {
        const variantLabel =
          i.variants && i.variants.length > 0
            ? ` (${i.variants.map(v => v.option).join(", ")})`
            : "";
        return {
          name: `${i.product?.name || i.product}${variantLabel}`,
          brand: i.product?.brand || undefined,
          quantity: i.quantity,
          priceAtSale: i.priceAtSale,
          subtotal: i.priceAtSale * i.quantity,
        };
      }),
      totalAmount: sale.totalAmount,
    };

    res.json(invoiceData);
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

/* =========================================================
   DELETE SALE (soft delete)
   Admin only
========================================================= */
router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    // ✅ Soft delete instead of hard remove
    await sale.safeDelete();

    res.json({ message: "Sale deactivated (soft deleted) successfully" });
  } catch (err) {
    console.error("Error deleting sale:", err);
    res.status(500).json({ error: "Failed to delete sale" });
  }
});

export default router;
   
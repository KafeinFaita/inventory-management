// routes/dashboardRoutes.js
import express from "express";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Sale from "../models/Sale.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    // 1️⃣ Counts
    const totalProducts = await Product.countDocuments();
    const totalBrands = await Brand.countDocuments();
    const totalCategories = await Category.countDocuments();

    // 2️⃣ Low-stock products (variant-aware)
    const products = await Product.find().select("name hasVariants stock variants");
    const lowStockProducts = [];

    for (const p of products) {
      if (p.hasVariants) {
        p.variants.forEach((v) => {
          if (v.stock <= 5) {
            lowStockProducts.push({
              _id: p._id,
              name: p.name,
              variant: v.name,   // e.g. "Red - M"
              stock: v.stock,
            });
          }
        });
      } else {
        if (p.stock <= 5) {
          lowStockProducts.push({
            _id: p._id,
            name: p.name,
            stock: p.stock,
          });
        }
      }
    }

    // 3️⃣ Monthly sales (rolling 12 months, zero-filled, with year)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const salesByMonth = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          totalItemsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const now = new Date();
    const monthlySales = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth(); // 0–11
      const monthName = monthNames[monthIndex];

      const monthData = salesByMonth.find(
        (m) => m._id.year === year && m._id.month === monthIndex + 1
      );

      monthlySales.push({
        month: `${monthName} ${year}`, // e.g. "Oct 2025"
        itemsSold: monthData?.totalItemsSold || 0,
        totalRevenue: monthData?.totalRevenue || 0,
      });
    }

    // 4️⃣ Latest 10 sales
    const latestSales = await Sale.find()
      .sort({ date: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate("items.product", "name price");

    // 5️⃣ Top 5 selling products
    const topProductsAgg = await Sale.aggregate([
      { $unwind: "$items" },
      { 
        $group: { 
          _id: "$items.product", 
          totalSold: { $sum: "$items.quantity" } 
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const topProducts = await Product.find({ _id: { $in: topProductsAgg.map(p => p._id) } })
      .select("name price");

    const topProductsWithQty = topProductsAgg
      .map(pAgg => {
        const product = topProducts.find(p => p._id.equals(pAgg._id));
        if (!product) return null;
        return {
          _id: product._id,
          name: product.name,
          price: product.price,
          totalSold: pAgg.totalSold
        };
      })
      .filter(p => p !== null);

    res.json({
      totalProducts,
      totalBrands,
      totalCategories,
      lowStockProducts,
      monthlySales,
      latestSales,
      topProducts: topProductsWithQty
    });

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
// routes/dashboardRoutes.js
import express from "express";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Sale from "../models/Sale.js"; // ⬅️ import Sale model

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalBrands = await Brand.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Low-stock alert: products with stock <= 5
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select("name stock");

    // 🧮 Monthly Sales Aggregation (items sold + total revenue)
    const salesByMonth = await Sale.aggregate([
      {
        $group: {
          _id: { $month: "$date" },
          totalItemsSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Convert numeric months (1–12) to readable short names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlySales = salesByMonth.map((s) => ({
      month: monthNames[s._id - 1],
      itemsSold: s.totalItemsSold,
      totalRevenue: s.totalRevenue,
    }));

    res.json({
      totalProducts,
      totalBrands,
      totalCategories,
      lowStockProducts,
      monthlySales,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;


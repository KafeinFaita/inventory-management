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

    // 2️⃣ Low-stock products
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).select("name stock");

    // 3️⃣ Monthly sales (zero-filled)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const salesByMonth = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { $month: "$date" },
          totalItemsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const monthlySales = monthNames.map((month, index) => {
      const monthData = salesByMonth.find((m) => m._id === index + 1);
      return {
        month,
        itemsSold: monthData?.totalItemsSold || 0,
        totalRevenue: monthData?.totalRevenue || 0,
      };
    });

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


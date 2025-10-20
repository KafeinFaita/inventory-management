import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productRoutes from "./routes/productRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import poRoutes from "./routes/poRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import Product from "./models/Product.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import fs from "fs";

// ✅ Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/debug/uploads", (req, res) => {
  const testPath = path.join(__dirname, "uploads", "logos");
  res.json({
    exists: fs.existsSync(testPath),
    files: fs.existsSync(testPath) ? fs.readdirSync(testPath) : [],
    resolvedPath: testPath,
  });
});

// ✅ Serve uploaded files (e.g., logos) reliably
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", poRoutes);


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}

// ✅ Plug in error middleware AFTER routes
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// Update products without hasVariants attribute
Product.updateMany(
  { hasVariants: { $exists: false } },
  { $set: { hasVariants: false } }
)
  .then((res) =>
    console.log(`✅ Updated ${res.modifiedCount} old products with hasVariants:false`)
  )
  .catch((err) => console.error("❌ Failed to update old products:", err));

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
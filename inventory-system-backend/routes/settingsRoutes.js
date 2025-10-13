import express from "express";
import Setting from "../models/Setting.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import fs from "fs";

// ✅ NEW: imports for file upload
import multer from "multer";
import path from "path";

const router = express.Router();

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join("uploads", "logos")),
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Get current settings
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      // create default if none exists
      settings = await Setting.create({
        businessName: "My Business",
        businessLogoUrl: "",
        businessAddress: "",
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// list existing logos
router.get("/logos", protect, adminOnly, (req, res) => {
  const dir = path.join(process.cwd(), "uploads", "logos");
  try {
    const files = fs.readdirSync(dir);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const urls = files.map(f => `${baseUrl}/uploads/logos/${f}`);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Failed to list logos" });
  }
});


// Update settings (admin only)
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Upload logo (admin only) with full URL
router.post("/logo", protect, adminOnly, upload.single("logo"), async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    settings.businessLogoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
    await settings.save();

    res.json({ logoUrl: settings.businessLogoUrl });
  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

// delete current logo
router.delete("/logo", protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) return res.status(404).json({ error: "Settings not found" });

    // Optionally delete the file from disk
    if (settings.businessLogoUrl) {
      const filePath = settings.businessLogoUrl.split("/uploads/")[1];
      const absPath = path.join(process.cwd(), "uploads", filePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }

    settings.businessLogoUrl = "";
    await settings.save();
    res.json({ message: "Logo deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete logo" });
  }
});

export default router;
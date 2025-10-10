import express from "express";
import Setting from "../models/Setting.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get current settings
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      // create default if none exists
      settings = await Setting.create({
        businessName: "My Business",
        businessLogo: "",
        address: "",
        // add other default fields as needed
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

export default router;

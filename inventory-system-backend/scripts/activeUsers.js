// scripts/backfillActiveUsers.js
import mongoose from "mongoose";
import User from "../models/User.js"; // your updated User model with safeDelete plugin
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await User.updateMany(
      { active: { $exists: false } }, // only users missing the field
      { $set: { active: true, deletedAt: null } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with active=true`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
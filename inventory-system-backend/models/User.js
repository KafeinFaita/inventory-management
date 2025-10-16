// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import safeDeletePlugin from "../plugins/safeDelete.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🛡️ Apply safe delete plugin
userSchema.plugin(safeDeletePlugin);

// ✅ Useful indexes
userSchema.index({ role: 1, active: 1 }); // quick filtering by role
userSchema.index({ active: 1 }); // default active-only queries

const User = mongoose.model("User", userSchema);

export default User;
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateRegister, validateLogin } from "../middleware/validator.js";
import { validateRequest } from "../middleware/validator.js";

const router = express.Router();

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register new user
router.post(
  "/register",
  validateRegister(),
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: "User already exists." });
      }

      const user = await User.create({ name, email, password, role });
      const token = generateToken(user._id, user.role);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: "Email already in use." });
      }
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  }
);

// Login
router.post(
  "/login",
  validateLogin(),
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Authentication logic
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const token = generateToken(user._id, user.role);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  }
);

// Get logged-in user info
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ error: "User not found." });

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

export default router;
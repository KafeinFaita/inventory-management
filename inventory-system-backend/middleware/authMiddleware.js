import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) return res.status(401).json({ error: "Not authorized, no token" });
};

// Admin-only middleware
export const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") next();
  else res.status(403).json({ error: "Access denied. Admins only." });
};

// Staff-only middleware (optional, for future use)
export const staffOnly = (req, res, next) => {
  if (req.user?.role === "staff") next();
  else res.status(403).json({ error: "Access denied. Staff only." });
};

// Admin or Staff allowed middleware
export const allowRoles = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) next();
  else res.status(403).json({ error: "Access denied. Insufficient role." });
};


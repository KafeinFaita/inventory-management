import { body, validationResult } from "express-validator";

// ✅ Wrapper to handle validation results
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }
  next();
};

// ✅ Product validation rules
export const validateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),

  // Only enforce top-level price if product has no variants
  body("price")
    .if((value, { req }) => !req.body.hasVariants)
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0 for non-variant products"),

  // Only enforce top-level stock if product has no variants
  body("stock")
    .if((value, { req }) => !req.body.hasVariants)
    .isInt({ min: 0 })
    .withMessage("Stock must be >= 0 for non-variant products"),

  body("hasVariants")
    .optional()
    .isBoolean(),

  // If hasVariants is true, variants must be an array with at least one element
  body("variants")
    .if((value, { req }) => req.body.hasVariants)
    .isArray({ min: 1 })
    .withMessage("Variants must be provided when hasVariants is true"),

  // ✅ Per-variant validation
  body("variants.*.price")
    .if((value, { req }) => req.body.hasVariants)
    .isFloat({ gt: 0 })
    .withMessage("Each variant must have a price greater than 0"),

  body("variants.*.stock")
    .if((value, { req }) => req.body.hasVariants)
    .isInt({ min: 0 })
    .withMessage("Each variant must have stock >= 0"),

  body("variants.*.attributes")
    .if((value, { req }) => req.body.hasVariants)
    .notEmpty()
    .withMessage("Each variant must have attributes defined"),
];


export const validateSale = () => [
  // Items array must exist and not be empty
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one sale item is required"),

  // Each item must have a valid product ID
  body("items.*.product")
    .isMongoId()
    .withMessage("Each sale item must reference a valid product ID"),

  // Quantity must be an integer ≥ 1
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  // Price at sale must be a number ≥ 0
  body("items.*.priceAtSale")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non‑negative number"),

  // Variants array (if present) must have category + option
  body("items.*.variants.*.category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant category cannot be empty"),
  body("items.*.variants.*.option")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant option cannot be empty"),

  // Customer info
  body("customerEmail")
    .optional()
    .isEmail()
    .withMessage("Customer email must be valid"),
  body("customerPhone")
    .optional()
    .isString()
    .isLength({ min: 7, max: 20 })
    .withMessage("Customer phone must be 7–20 characters"),
];

// ✅ For creating a new user
export const validateUserCreate = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(["admin", "staff"])
    .withMessage("Role must be either 'admin' or 'staff'"),
];

// ✅ For updating an existing user
export const validateUserUpdate = () => [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(["admin", "staff"])
    .withMessage("Role must be either 'admin' or 'staff'"),
];

// ✅ Register validation
export const validateRegister = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(["admin", "staff"])
    .withMessage("Role must be either 'admin' or 'staff'"),
];

// ✅ Login validation
export const validateLogin = () => [
  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];
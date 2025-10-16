// middleware/errorMiddleware.js

// 404 handler for unknown routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message, // ✅ standardized key
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
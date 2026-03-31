const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const mongoose = require("mongoose");

require("dotenv").config();
const { requireMongoUri } = require("./config/mongoUri");

const app = express();

// Basic request parsing
app.use(morgan("dev"));
// Video/ảnh data URL có thể rất lớn — tăng giới hạn (mặc định ~100kb)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());

// MongoDB connection (Atlas)
const mongoUri = requireMongoUri();

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connect failed:", err);
    process.exit(1);
  });

// API routes (đặt trước static để ưu tiên /api/*)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/carts", require("./routes/carts"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api/lesson-quizzes", require("./routes/lessonQuizzes"));
app.use("/api/payment-orders", require("./routes/paymentOrders"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Serve the existing frontend template (static HTML pages)
app.use(express.static(path.join(__dirname, "..", "OnlineLearningWeb")));

// 404 handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).send({
    message: err.message,
  });
});

module.exports = app;


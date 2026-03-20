const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Types.ObjectId,
      ref: "course",
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

// Giống kiểu cart embedded trong NNPTUD-S2: cart chỉ chứa danh sách cartItems bên trong
const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    cartItems: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("cart", cartSchema);


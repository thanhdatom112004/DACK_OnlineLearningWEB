const mongoose = require("mongoose");

const reservationItems = mongoose.Schema({
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
  title: { type: String },
  price: { type: Number },
  subtotal: { type: Number },
});

const reservationSchema = mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: {
    type: [reservationItems],
    default: [],
  },
  amount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["actived", "expired", "cancelled", "paid"],
    default: "actived",
  },
  expiredIn: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("reservation", reservationSchema);


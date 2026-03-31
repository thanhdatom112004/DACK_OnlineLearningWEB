const mongoose = require("mongoose");

const videoItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Giá không được âm"],
      max: [999999999999, "Giá vượt quá giới hạn (VND)"],
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    images: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8N7qdG-B9FW47yJaKEKCDpidao3fC1raDbpgldxW-Vr47N8vOGMdT6NrFib3y_QGyLZICFQdatPcNA2TDKw&s&ec=121516180",
    },
    videos: {
      type: [videoItemSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("course", courseSchema);


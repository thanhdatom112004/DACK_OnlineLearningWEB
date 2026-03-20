const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const courseModel = require("../models/courses");
const inventoryModel = require("../models/inventories");
const { checkLogin, checkRole } = require("../middleware/authHandler");
const { convertTitleToSlug } = require("../utils/titleHandler");

// USER/Admin can view courses
router.get("/", async function (req, res, next) {
  const courses = await courseModel.find({ isDeleted: false });
  res.send(courses);
});

router.get("/:id", async function (req, res, next) {
  try {
    const result = await courseModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!result) return res.status(404).send({ message: "id not found" });
    res.send(result);
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

// ADMIN CRUD
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, price = 0, description = "", category = "", images, videos = [] } = req.body;

    const videosNormalized = Array.isArray(videos)
      ? videos
          .map(function (v) {
            return {
              title: (v && v.title ? String(v.title) : "").trim() || "Bài học",
              url: (v && v.url ? String(v.url) : "").trim(),
            };
          })
          .filter(function (v) {
            return v.url.length > 0;
          })
      : [];

    const course = await courseModel.create(
      [
        {
          title,
          slug: convertTitleToSlug(title),
          price,
          description,
          category,
          images,
          videos: videosNormalized,
        },
      ],
      { session }
    );

    const createdCourse = course[0];

    const newInventory = await inventoryModel.create(
      [
        {
          course: createdCourse._id,
          stock: 1,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.send({ course: createdCourse, inventory: newInventory[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ message: String(error.message || error) });
  }
});

router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    const existing = await courseModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!existing) return res.status(404).send({ message: "id not found" });

    const { title, price, description, category, images, videos } = req.body;
    const $set = {};

    if (title !== undefined) {
      $set.title = title;
      $set.slug = convertTitleToSlug(String(title));
    }
    if (price !== undefined) $set.price = Number(price);
    if (description !== undefined) $set.description = description;
    if (category !== undefined) $set.category = category;
    if (images !== undefined) $set.images = images;

    if (Array.isArray(videos)) {
      $set.videos = videos
        .map(function (v) {
          return {
            title: (v && v.title ? String(v.title) : "").trim() || "Bài học",
            url: (v && v.url ? String(v.url) : "").trim(),
          };
        })
        .filter(function (v) {
          return v.url.length > 0;
        });
    }

    const updated = await courseModel.findByIdAndUpdate(req.params.id, { $set }, { new: true, runValidators: true });
    if (!updated) return res.status(404).send({ message: "id not found" });
    res.send(updated);
  } catch (e) {
    res.status(400).send({ message: String(e.message || e) });
  }
});

router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    const updated = await courseModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!updated) return res.status(404).send({ message: "id not found" });
    res.send(updated);
  } catch (e) {
    res.status(400).send({ message: String(e.message || e) });
  }
});

module.exports = router;


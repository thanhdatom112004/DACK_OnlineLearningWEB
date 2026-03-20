const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { checkLogin } = require("../middleware/authHandler");
const { userPostValidation, validateResult } = require("../middleware/validationHandler");

const userController = require("../controllers/users");
const roleModel = require("../models/roles");
const { sendMail } = require("../utils/mailHandler");

// POST /api/auth/register
router.post("/register", userPostValidation, validateResult, async function (req, res, next) {
  try {
    const { username, password, email, avatarUrl } = req.body;

    // Auto-assign role USER; if missing, create it automatically
    const userRole = await roleModel.findOneAndUpdate(
      { name: "USER" },
      {
        $set: { isDeleted: false },
        $setOnInsert: { name: "USER", description: "Normal user" },
      },
      { new: true, upsert: true }
    );

    const newUser = await userController.CreateAnUser(
      username,
      password,
      email,
      userRole._id,
      "",
      avatarUrl || "",
      false,
      undefined
    );

    const populatedUser = await userController.FindByID(newUser._id);
    // Avoid returning hashed password
    const { password: _pw, ...safeUser } = populatedUser.toObject();
    res.send(safeUser);
  } catch (e) {
    res.status(400).send({ message: String(e.message || e) });
  }
});

// POST /api/auth/login
router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    let getUser = await userController.FindByUsername(username);
    if (!getUser) {
      return res.status(404).send({ message: "username khong ton tai hoac thong tin dang nhap sai" });
    }

    let result = false;
    try {
      result = bcrypt.compareSync(password, getUser.password);
    } catch (e) {
      result = false;
    }

    // Backward compatibility: user inserted manually with plaintext password.
    // If plaintext matches, re-save user to trigger pre-save hash.
    if (!result && getUser.password === password) {
      getUser.password = password;
      await getUser.save();
      result = true;
    }

    if (!result) {
      return res.status(404).send({ message: "username khong ton tai hoac thong tin dang nhap sai" });
    }

    let token = jwt.sign(
      {
        id: getUser._id,
        exp: Date.now() + 3600 * 1000,
      },
      process.env.JWT_SECRET || "HUTECH"
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    });
    const populatedUser = await userController.FindByID(getUser._id);
    const { password: _pw, ...safeUser } = populatedUser.toObject();
    res.send({ token, user: safeUser });
  } catch (e) {
    res.status(500).send({ message: String(e.message || e) });
  }
});

// GET /api/auth/me
router.get("/me", checkLogin, async function (req, res, next) {
  let user = await userController.FindByID(req.userId);
  res.send(user);
});

// POST /api/auth/logout
router.post("/logout", checkLogin, function (req, res, next) {
  res.cookie("token", null, { maxAge: 0, httpOnly: true });
  res.send("logout");
});

// POST /api/auth/changepassword
router.post("/changepassword", checkLogin, async function (req, res, next) {
  let { oldPassword, newPassword } = req.body;
  let user = await userController.FindByID(req.userId);
  if (!user) return res.status(404).send({ message: "user not found" });

  // bcrypt compare sync works with hashed password in template
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(403).send({ message: "oldPassword khong dung" });
  }

  user.password = newPassword;
  await user.save();
  res.send("da cap nhat password");
});

// POST /api/auth/forgotpassword
// Lưu ý: cần SMTP cấu hình mới gửi được mail
router.post("/forgotpassword", async function (req, res, next) {
  try {
    let { email } = req.body;
    let user = await userController.FindByEmail(email);
    if (!user) return res.send("email khong ton tai");

    user.forgotPasswordToken = crypto.randomBytes(31).toString("hex");
    user.forgotPasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // If SMTP not configured, tell user
    await sendMail(
      user.email,
      (process.env.RESET_PASSWORD_URL_BASE || "http://localhost:3001") + "/api/auth/resetpassword/" + user.forgotPasswordToken
    );

    res.send("gui mail reset pass");
  } catch (e) {
    res.status(500).send({ message: String(e.message || e) });
  }
});

// POST /api/auth/resetpassword/:token
router.post("/resetpassword/:token", async function (req, res, next) {
  try {
    let token = req.params.token;
    let newPassword = req.body.password;

    let getUser = await userController.FindByToken(token);
    if (!getUser) return res.send("loi token");

    getUser.password = newPassword;
    getUser.forgotPasswordToken = "";
    getUser.forgotPasswordTokenExp = null;
    await getUser.save();

    res.send("da cap nhat");
  } catch (e) {
    res.status(500).send({ message: String(e.message || e) });
  }
});

module.exports = router;


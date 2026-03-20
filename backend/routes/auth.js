const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { checkLogin } = require("../middleware/authHandler");
const { userPostValidation, validateResult } = require("../middleware/validationHandler");

const userController = require("../controllers/users");
const userModel = require("../models/users");
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

function safeUserDoc(user) {
  if (!user) return null;
  const o = user.toObject ? user.toObject() : user;
  const { password: _p, ...rest } = o;
  return rest;
}

// GET /api/auth/me
router.get("/me", checkLogin, async function (req, res, next) {
  let user = await userController.FindByID(req.userId);
  if (!user) return res.status(404).send({ message: "user not found" });
  res.send(safeUserDoc(user));
});

// PUT /api/auth/profile — cập nhật thông tin (không cho đổi email)
router.put("/profile", checkLogin, async function (req, res, next) {
  try {
    if (req.body && req.body.email !== undefined) {
      return res.status(400).send({ message: "Không được thay đổi email" });
    }

    const user = await userModel.findOne({ _id: req.userId, isDeleted: false });
    if (!user) return res.status(404).send({ message: "user not found" });

    const { username, fullName, avatarUrl } = req.body;

    if (username !== undefined) {
      const u = String(username).trim();
      if (!u) return res.status(400).send({ message: "Tên đăng nhập không được để trống" });
      if (u !== user.username) {
        const taken = await userModel.findOne({
          username: u,
          isDeleted: false,
          _id: { $ne: user._id },
        });
        if (taken) return res.status(400).send({ message: "Tên đăng nhập đã được sử dụng" });
      }
      user.username = u;
    }

    if (fullName !== undefined) {
      user.fullName = String(fullName).trim();
    }

    if (avatarUrl !== undefined) {
      const a = String(avatarUrl).trim();
      if (a === "") {
        user.avatarUrl = "https://i.sstatic.net/l60Hf.png";
      } else if (!/^https?:\/\//i.test(a) && !a.startsWith("data:")) {
        return res.status(400).send({ message: "Avatar phải là URL (http/https) hoặc data URL" });
      } else {
        user.avatarUrl = a;
      }
    }

    await user.save();
    const populated = await userController.FindByID(user._id);
    res.send(safeUserDoc(populated));
  } catch (e) {
    res.status(400).send({ message: String(e.message || e) });
  }
});

// POST /api/auth/logout
router.post("/logout", checkLogin, function (req, res, next) {
  res.cookie("token", null, { maxAge: 0, httpOnly: true });
  res.send("logout");
});

// POST /api/auth/changepassword
router.post("/changepassword", checkLogin, async function (req, res, next) {
  try {
    let { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send({ message: "Cần nhập mật khẩu cũ và mật khẩu mới" });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).send({ message: "Mật khẩu mới tối thiểu 8 ký tự" });
    }

    let user = await userModel.findOne({ _id: req.userId, isDeleted: false });
    if (!user) return res.status(404).send({ message: "user not found" });

    let ok = false;
    try {
      ok = bcrypt.compareSync(oldPassword, user.password);
    } catch (e) {
      ok = false;
    }
    if (!ok && user.password === oldPassword) {
      ok = true;
    }

    if (!ok) {
      return res.status(403).send({ message: "Mật khẩu cũ không đúng" });
    }

    user.password = newPassword;
    await user.save();
    res.send({ ok: true, message: "Đã cập nhật mật khẩu" });
  } catch (e) {
    res.status(400).send({ message: String(e.message || e) });
  }
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


const userModel = require("../models/users");

module.exports = {
  CreateAnUser: async function (
    username,
    password,
    email,
    roleId,
    fullName = "",
    avatarUrl = "",
    status = false,
    session
  ) {
    const newItem = new userModel({
      username,
      password,
      email,
      role: roleId,
      fullName,
      avatarUrl,
      status,
    });

    await newItem.save({ session });
    return newItem;
  },

  FindByID: async function (id) {
    return await userModel
      .findOne({ _id: id, isDeleted: false })
      .populate({ path: "role", select: "name" });
  },

  FindByUsername: async function (username) {
    return await userModel.findOne({ username, isDeleted: false });
  },

  FindByEmail: async function (email) {
    return await userModel.findOne({ email, isDeleted: false });
  },

  FindByToken: async function (token) {
    const user = await userModel.findOne({
      forgotPasswordToken: token,
      isDeleted: false,
    });

    if (user && user.forgotPasswordTokenExp > Date.now()) return user;
    return undefined;
  },

  getAllUser: async function () {
    return await userModel
      .find({ isDeleted: false })
      .populate({ path: "role", select: "name" });
  },
};


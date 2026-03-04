const User = require("../models/User");

const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("username role duckState");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const listUsersForAdmin = async (req, res, next) => {
  try {
    const users = await User.find({}, "username role").sort({ username: 1 });
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyProfile,
  listUsersForAdmin
};

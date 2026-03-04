const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  duckState: {
    type: String,
    enum: ["neutral", "happy", "angry"],
    default: "neutral"
  }
});

module.exports = mongoose.model("User", UserSchema);

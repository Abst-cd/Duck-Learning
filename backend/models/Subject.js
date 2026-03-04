const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalSeconds: {
    type: Number,
    required: true,
    min: 1
  },
  remainingSeconds: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["idle", "running", "completed", "stopped"],
    default: "idle"
  },
  startedAt: {
    type: Date,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Subject", SubjectSchema);

const express = require("express");
const {
  listMySubjects,
  createSubject,
  updateSubjectTime,
  startSubject,
  stopSubject,
  deleteSubject
} = require("../controllers/subjectController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listMySubjects);
router.post("/", createSubject);
router.patch("/:id/time", updateSubjectTime);
router.post("/:id/start", startSubject);
router.post("/:id/stop", stopSubject);
router.delete("/:id", deleteSubject);

module.exports = router;

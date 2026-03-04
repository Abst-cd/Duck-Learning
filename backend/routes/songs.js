const express = require("express");
const {
  listMySongs,
  createSong,
  updateSong,
  deleteSong
} = require("../controllers/songController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authenticateToken);
router.get("/", listMySongs);
router.post("/", createSong);
router.put("/:id", updateSong);
router.delete("/:id", deleteSong);

module.exports = router;

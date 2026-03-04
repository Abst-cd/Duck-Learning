const express = require("express");
const { getMyProfile, listUsersForAdmin } = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/me", getMyProfile);
router.get("/admin/list", authorizeRoles("admin"), listUsersForAdmin);

module.exports = router;

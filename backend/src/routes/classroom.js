const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createClassroom,
  getActiveClassrooms,
  getRecentEndedClassrooms,
  getClassroomById,
  endClassroomController,
} = require("../controllers/classroomController");

router.post("/", protect, createClassroom);
router.get("/active", protect, getActiveClassrooms);
router.get("/recent", protect, getRecentEndedClassrooms);
router.get("/:id", protect, getClassroomById);
router.post("/:id/end", protect, endClassroomController);

module.exports = router;

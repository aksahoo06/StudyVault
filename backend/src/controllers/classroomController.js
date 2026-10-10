const Classroom = require("../models/classroom");
const {
  scheduleMaxDurationTimer,
  endClassroom,
} = require("../sockets/classroomLifecycle");

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Helper to check and handle passive 15-minute TTL expiration 
const checkAndExpireClassroom = async (classroom) => {
  if (classroom.status === "active") {
    const elapsed = Date.now() - new Date(classroom.startTime).getTime();
    if (elapsed >= FIFTEEN_MINUTES_MS) {
      await endClassroom(classroom._id, "max_duration_exceeded");
      return true; // Expired
    }
  }
  return false; // Still active or already ended
};

// @desc    Create a new live classroom
// @route   POST /api/classrooms
// @access  Private
const createClassroom = async (req, res) => {
  try {
    const { className } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({ message: "Classroom name is required" });
    }

    const newClassroom = await Classroom.create({
      className: className.trim(),
      creatorUserId: req.user._id,
      startTime: new Date(),
      status: "active",
      whiteboardState: [],
      chatMessages: [],
    });

    // Schedule 15-minute auto-expiration timer
    scheduleMaxDurationTimer(newClassroom._id, newClassroom.startTime);

    const populatedClassroom = await Classroom.findById(newClassroom._id).populate(
      "creatorUserId",
      "name email"
    );

    return res.status(201).json(populatedClassroom);
  } catch (error) {
    console.error("Error in createClassroom:", error);
    return res.status(500).json({ message: "Server error creating classroom" });
  }
};

// @desc    Get all active classrooms (with passive 15-min TTL check)
// @route   GET /api/classrooms/active
// @access  Private
const getActiveClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ status: "active" }).populate(
      "creatorUserId",
      "name email"
    );

    const activeClassrooms = [];
    for (const classroom of classrooms) {
      const isExpired = await checkAndExpireClassroom(classroom);
      if (!isExpired) {
        activeClassrooms.push(classroom);
      }
    }

    return res.status(200).json(activeClassrooms);
  } catch (error) {
    console.error("Error in getActiveClassrooms:", error);
    return res.status(500).json({ message: "Server error fetching active classrooms" });
  }
};

// @desc    Get last 3 ended classrooms for dashboard history
// @route   GET /api/classrooms/recent
// @access  Private
const getRecentEndedClassrooms = async (req, res) => {
  try {
    const recentEnded = await Classroom.find({ status: "ended" })
      .sort({ endedAt: -1 })
      .limit(3)
      .populate("creatorUserId", "name email");

    return res.status(200).json(recentEnded);
  } catch (error) {
    console.error("Error in getRecentEndedClassrooms:", error);
    return res.status(500).json({ message: "Server error fetching recent ended classrooms" });
  }
};

// @desc    Get single classroom by ID (with passive 15-min TTL check)
// @route   GET /api/classrooms/:id
// @access  Private
const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id).populate(
      "creatorUserId",
      "name email"
    );

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    await checkAndExpireClassroom(classroom);

    // Re-fetch populated classroom if status was modified during passive check
    const updatedClassroom = await Classroom.findById(req.params.id).populate(
      "creatorUserId",
      "name email"
    );

    return res.status(200).json(updatedClassroom);
  } catch (error) {
    console.error("Error in getClassroomById:", error);
    return res.status(500).json({ message: "Server error fetching classroom details" });
  }
};

// @desc    Manually end a classroom (Teacher only)
// @route   POST /api/classrooms/:id/end
// @access  Private
const endClassroomController = async (req, res) => {
  try {
    const result = await endClassroom(
      req.params.id,
      "manual_end_by_teacher",
      req.user._id
    );

    if (!result.success) {
      return res.status(result.status || 400).json({ message: result.message });
    }

    const populatedClassroom = await Classroom.findById(req.params.id).populate(
      "creatorUserId",
      "name email"
    );

    return res.status(200).json({
      message: "Classroom ended successfully",
      classroom: populatedClassroom,
    });
  } catch (error) {
    console.error("Error in endClassroomController:", error);
    return res.status(500).json({ message: "Server error ending classroom" });
  }
};

module.exports = {
  createClassroom,
  getActiveClassrooms,
  getRecentEndedClassrooms,
  getClassroomById,
  endClassroomController,
};

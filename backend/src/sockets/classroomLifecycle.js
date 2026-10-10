const Classroom = require("../models/classroom");

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const TWO_MINUTES_MS = 2 * 60 * 1000;

// In-memory timer registries
const maxDurationTimers = new Map();
const gracePeriodTimers = new Map();

// Helper to get socket.io instance
const getIO = () => {
  try {
    const { getIO: ioGetter } = require("./liveClassSocket");
    return ioGetter();
  } catch (err) {
    return null;
  }
};

/**
 * Schedule 15-minute maximum duration timer for a classroom
 */
const scheduleMaxDurationTimer = (classroomId, startTime) => {
  const idStr = classroomId.toString();

  // Clear existing timer if any
  cancelMaxDurationTimer(idStr);

  const startMs = new Date(startTime).getTime();
  const elapsedMs = Date.now() - startMs;
  const remainingMs = FIFTEEN_MINUTES_MS - elapsedMs;

  if (remainingMs <= 0) {
    // Expire immediately
    endClassroom(idStr, "max_duration_exceeded");
    return;
  }

  const timerRef = setTimeout(() => {
    endClassroom(idStr, "max_duration_exceeded");
  }, remainingMs);

  maxDurationTimers.set(idStr, timerRef);
  console.log(`Scheduled 15-min max timer for class ${idStr}, remaining: ${Math.round(remainingMs / 1000)}s`);
};

/**
 * Cancel 15-minute max duration timer
 */
const cancelMaxDurationTimer = (classroomId) => {
  const idStr = classroomId.toString();
  if (maxDurationTimers.has(idStr)) {
    clearTimeout(maxDurationTimers.get(idStr));
    maxDurationTimers.delete(idStr);
  }
};

/**
 * Handle teacher disconnect with a 2-minute grace period
 */
const handleTeacherDisconnect = async (classroomId, teacherUserId) => {
  const idStr = classroomId.toString();

  try {
    const classroom = await Classroom.findById(idStr);
    if (!classroom || classroom.status !== "active") return;

    // Check if user is creator/teacher
    if (classroom.creatorUserId.toString() !== teacherUserId.toString()) return;

    // Clear existing grace timer if any
    if (gracePeriodTimers.has(idStr)) {
      clearTimeout(gracePeriodTimers.get(idStr));
    }

    classroom.teacherDisconnectedAt = new Date();
    await classroom.save();

    // Broadcast teacher-disconnected event with 120s grace period
    const io = getIO();
    if (io) {
      io.to(idStr).emit("teacher-disconnected", {
        classroomId: idStr,
        gracePeriodSeconds: 120,
        disconnectedAt: classroom.teacherDisconnectedAt,
      });
    }

    // Schedule 2-minute grace timer
    const graceTimerRef = setTimeout(() => {
      console.log(`Teacher disconnect grace period expired for class ${idStr}`);
      endClassroom(idStr, "teacher_disconnected_timeout");
    }, TWO_MINUTES_MS);

    gracePeriodTimers.set(idStr, graceTimerRef);
    console.log(`Teacher disconnected from class ${idStr}. 2-minute grace timer started.`);
  } catch (error) {
    console.error(`Error in handleTeacherDisconnect for class ${idStr}:`, error);
  }
};

/**
 * Handle teacher reconnect before grace period expires
 */
const handleTeacherReconnect = async (classroomId, teacherUserId) => {
  const idStr = classroomId.toString();

  try {
    const classroom = await Classroom.findById(idStr);
    if (!classroom || classroom.status !== "active") return;

    if (classroom.creatorUserId.toString() !== teacherUserId.toString()) return;

    // If grace timer was running, clear it
    if (gracePeriodTimers.has(idStr)) {
      clearTimeout(gracePeriodTimers.get(idStr));
      gracePeriodTimers.delete(idStr);

      classroom.teacherDisconnectedAt = null;
      await classroom.save();

      const io = getIO();
      if (io) {
        io.to(idStr).emit("teacher-reconnected", {
          classroomId: idStr,
          reconnectedAt: new Date(),
        });
      }

      console.log(`Teacher reconnected to class ${idStr}. Grace period canceled.`);
    }
  } catch (error) {
    console.error(`Error in handleTeacherReconnect for class ${idStr}:`, error);
  }
};

/**
 * End classroom: Mark status as 'ended', purge temporary data (whiteboard/chat), broadcast event
 */
const endClassroom = async (classroomId, reason = "ended", requestingUserId = null) => {
  const idStr = classroomId.toString();

  try {
    const classroom = await Classroom.findById(idStr);
    if (!classroom) {
      return { success: false, status: 404, message: "Classroom not found" };
    }

    if (classroom.status === "ended") {
      return { success: true, classroom, alreadyEnded: true };
    }

    // Authorization check for manual user request
    if (requestingUserId) {
      if (classroom.creatorUserId.toString() !== requestingUserId.toString()) {
        return { success: false, status: 403, message: "Only the teacher can end this classroom" };
      }
    }

    // Cancel all running timers for this classroom
    cancelMaxDurationTimer(idStr);
    if (gracePeriodTimers.has(idStr)) {
      clearTimeout(gracePeriodTimers.get(idStr));
      gracePeriodTimers.delete(idStr);
    }

    // Update DB record and purge temporary data
    classroom.status = "ended";
    classroom.endedAt = new Date();
    classroom.whiteboardState = [];
    classroom.chatMessages = [];
    classroom.teacherDisconnectedAt = null;
    await classroom.save();

    // Broadcast socket notification
    const io = getIO();
    if (io) {
      io.to(idStr).emit("class-ended", {
        classroomId: idStr,
        reason,
        endedAt: classroom.endedAt,
      });
    }

    console.log(`Classroom ${idStr} ended. Reason: ${reason}. Temporary data purged.`);
    return { success: true, classroom };
  } catch (error) {
    console.error(`Error ending classroom ${idStr}:`, error);
    return { success: false, status: 500, message: "Server error ending classroom" };
  }
};

/**
 * Server boot restoration: check active classrooms from DB and restore max duration timers
 */
const restoreActiveTimers = async () => {
  try {
    const activeClassrooms = await Classroom.find({ status: "active" });
    console.log(`Restoring lifecycle timers for ${activeClassrooms.length} active classroom(s)...`);

    for (const classroom of activeClassrooms) {
      scheduleMaxDurationTimer(classroom._id, classroom.startTime);
    }
  } catch (error) {
    console.error("Error restoring active classroom timers on boot:", error);
  }
};

module.exports = {
  scheduleMaxDurationTimer,
  cancelMaxDurationTimer,
  handleTeacherDisconnect,
  handleTeacherReconnect,
  endClassroom,
  restoreActiveTimers,
};

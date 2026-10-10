const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  handleTeacherDisconnect,
  handleTeacherReconnect,
  endClassroom,
} = require("./classroomLifecycle");

let io = null;

const initLiveClassSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "https://study-vault-gray.vercel.app",
        "https://study-vault-gray.vercel.app/",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      socket.activeRooms = new Set();
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.name} - ${socket.user._id})`);

    // Join room & sync initial classroom state
    socket.on("join-room", async ({ classroomId }) => {
      if (classroomId) {
        const idStr = classroomId.toString();
        socket.join(idStr);
        socket.activeRooms.add(idStr);
        console.log(`User ${socket.user.name} joined room ${idStr}`);

        // Check if user is teacher reconnecting
        await handleTeacherReconnect(idStr, socket.user._id);

        // Fetch classroom snapshot & sync state to the joining user
        try {
          const Classroom = require("../models/classroom");
          const classroom = await Classroom.findById(idStr);
          if (classroom) {
            const isTeacher =
              classroom.creatorUserId.toString() === socket.user._id.toString();
            socket.emit("init-classroom-state", {
              whiteboardState: classroom.whiteboardState || [],
              chatMessages: classroom.chatMessages || [],
              isTeacher,
              status: classroom.status,
              teacherUserId: classroom.creatorUserId,
            });
          }
        } catch (err) {
          console.error(`Error sending initial classroom state for ${idStr}:`, err);
        }
      }
    });

    // Leave room
    socket.on("leave-room", ({ classroomId }) => {
      if (classroomId) {
        const idStr = classroomId.toString();
        socket.leave(idStr);
        socket.activeRooms.delete(idStr);
        console.log(`User ${socket.user.name} left room ${idStr}`);
      }
    });

    // Real-time whiteboard drawing event (Teacher only)
    socket.on("draw-line", async ({ classroomId, stroke }) => {
      if (!classroomId || !stroke) return;

      try {
        const Classroom = require("../models/classroom");
        const idStr = classroomId.toString();
        const classroom = await Classroom.findById(idStr);
        if (!classroom || classroom.status !== "active") return;

        // Authorization check: strictly teacher only
        if (classroom.creatorUserId.toString() !== socket.user._id.toString()) {
          return;
        }

        // Persist stroke to MongoDB
        await Classroom.findByIdAndUpdate(idStr, {
          $push: { whiteboardState: stroke },
        });

        // Broadcast stroke to all other users in room
        socket.to(idStr).emit("draw-line", stroke);
      } catch (err) {
        console.error("Error processing draw-line socket event:", err);
      }
    });

    // Clear whiteboard canvas event (Teacher only)
    socket.on("clear-canvas", async ({ classroomId }) => {
      if (!classroomId) return;

      try {
        const Classroom = require("../models/classroom");
        const idStr = classroomId.toString();
        const classroom = await Classroom.findById(idStr);
        if (!classroom || classroom.status !== "active") return;

        // Authorization check: strictly teacher only
        if (classroom.creatorUserId.toString() !== socket.user._id.toString()) {
          return;
        }

        // Clear whiteboard state in DB
        await Classroom.findByIdAndUpdate(idStr, {
          $set: { whiteboardState: [] },
        });

        // Broadcast clear event to room
        io.to(idStr).emit("clear-canvas");
      } catch (err) {
        console.error("Error processing clear-canvas socket event:", err);
      }
    });

    // Real-time text chat message event
    socket.on("send-message", async ({ classroomId, text }, callback) => {
      if (!classroomId || !text || !text.trim()) return;

      try {
        const Classroom = require("../models/classroom");
        const idStr = classroomId.toString();
        const classroom = await Classroom.findById(idStr);
        if (!classroom || classroom.status !== "active") {
          if (typeof callback === "function") {
            callback({ success: false, message: "Classroom not active" });
          }
          return;
        }

        const messageObj = {
          senderId: socket.user._id,
          senderName: socket.user.name,
          text: text.trim(),
          timestamp: new Date(),
        };

        // Persist chat message to MongoDB
        await Classroom.findByIdAndUpdate(idStr, {
          $push: { chatMessages: messageObj },
        });

        // Broadcast new chat message to room
        io.to(idStr).emit("new-message", messageObj);

        if (typeof callback === "function") {
          callback({ success: true, message: messageObj });
        }
      } catch (err) {
        console.error("Error processing send-message socket event:", err);
        if (typeof callback === "function") {
          callback({ success: false, message: "Server error sending message" });
        }
      }
    });

    // WebRTC Signaling: Teacher Audio Offer (Teacher only)
    socket.on("webrtc-offer", async ({ classroomId, offer }) => {
      if (!classroomId || !offer) return;
      try {
        const Classroom = require("../models/classroom");
        const idStr = classroomId.toString();
        const classroom = await Classroom.findById(idStr);
        if (!classroom || classroom.status !== "active") return;

        // Security check: strictly teacher only
        if (classroom.creatorUserId.toString() !== socket.user._id.toString()) {
          console.warn(`User ${socket.user.name} attempted unauthorized audio stream publication`);
          return;
        }

        socket.to(idStr).emit("webrtc-offer", { offer, senderSocketId: socket.id });
      } catch (err) {
        console.error("Error processing WebRTC offer:", err);
      }
    });

    // WebRTC Signaling: Student Audio Answer
    socket.on("webrtc-answer", ({ classroomId, answer, targetSocketId }) => {
      if (!classroomId || !answer) return;
      const idStr = classroomId.toString();
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-answer", { answer, senderSocketId: socket.id });
      } else {
        socket.to(idStr).emit("webrtc-answer", { answer, senderSocketId: socket.id });
      }
    });

    // WebRTC Signaling: ICE Candidates Exchange
    socket.on("webrtc-ice-candidate", ({ classroomId, candidate, targetSocketId }) => {
      if (!classroomId || !candidate) return;
      const idStr = classroomId.toString();
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-ice-candidate", { candidate, senderSocketId: socket.id });
      } else {
        socket.to(idStr).emit("webrtc-ice-candidate", { candidate, senderSocketId: socket.id });
      }
    });

    // WebRTC Mic State Broadcast
    socket.on("teacher-mic-state", async ({ classroomId, isMuted }) => {
      if (!classroomId) return;
      try {
        const Classroom = require("../models/classroom");
        const idStr = classroomId.toString();
        const classroom = await Classroom.findById(idStr);
        if (!classroom || classroom.status !== "active") return;

        if (classroom.creatorUserId.toString() !== socket.user._id.toString()) return;

        io.to(idStr).emit("teacher-mic-state", { isMuted });
      } catch (err) {
        console.error("Error broadcasting mic state:", err);
      }
    });

    // Manual end classroom via socket
    socket.on("end-class", async ({ classroomId }, callback) => {
      if (!classroomId) return;
      console.log(`User ${socket.user.name} requested end class for ${classroomId}`);
      const result = await endClassroom(classroomId, "manual_end_by_teacher", socket.user._id);
      if (typeof callback === "function") {
        callback(result);
      }
    });

    // Socket disconnect
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.user.name})`);
      if (socket.activeRooms && socket.activeRooms.size > 0) {
        for (const roomId of socket.activeRooms) {
          await handleTeacherDisconnect(roomId, socket.user._id);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

module.exports = {
  initLiveClassSocket,
  getIO,
};

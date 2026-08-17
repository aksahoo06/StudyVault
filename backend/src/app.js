
const express = require("express");
const app = express();
const cors = require("cors");

const authRoutes = require("./routes/auth.js");
const dashboardRoutes = require("./routes/dashboard.js");
const noteRoutes = require("./routes/note.js");
const flashRoutes = require("./routes/flashcard.js");
const aiRoutes =
  require("./routes/aiRoutes");
const chatRoutes = require("./routes/chatRoutes");

const path = require("path");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/flashcards", flashRoutes);
app.use("/api/chat", chatRoutes);
app.use(
  "/api/ai",
  aiRoutes
);

module.exports = app;
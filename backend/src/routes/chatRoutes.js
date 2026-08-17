const express = require("express");

const router = express.Router();

const {
    chat,
    getChatHistory,
    deleteChatHistory
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, chat);

router.get("/", protect, getChatHistory);
router.delete("/:conversationId", protect, deleteChatHistory);
module.exports = router;
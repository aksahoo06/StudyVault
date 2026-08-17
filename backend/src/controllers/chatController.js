const mongoose = require("mongoose");

const Note = require("../models/note");

const { chatWithPdf } = require("../../services/ai/chat_services");
const Conversation = require("../models/conversations.js");

const chat = async (req, res) => {
    try {
        const { noteId, message } = req.body;

        // Validate noteId
        if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({
                message: "Invalid noteId"
            });
        }

        // Validate message
        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                message: "Message cannot be empty"
            });
        }

        // Prevent excessively large requests
        if (message.length > 5000) {
            return res.status(400).json({
                message: "Message is too long"
            });
        }

        // NEW SECURE CODE: Direct prompt injection / jailbreak keyword defense check
        // Stops common malicious command overrides at the controller level before hitting Gemini
        const INJECTION_KEYWORDS = [
            "ignore previous instructions",
            "ignore all instructions",
            "developer mode",
            "jailbreak",
            "bypass constraints"
        ];
        const lowerMsg = message.toLowerCase();
        const isSuspicious = INJECTION_KEYWORDS.some(keyword => lowerMsg.includes(keyword));
        if (isSuspicious) {
            return res.status(400).json({
                message: "Invalid query parameters detected."
            });
        }

        // User comes from JWT authentication
        const userId = req.user._id;

        // Verify that the PDF belongs to this user
        const note = await Note.findOne({
            _id: noteId,
            uploadedBy: userId
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        // Run the RAG pipeline
        const result = await chatWithPdf({
            userId,
            noteId,
            message: message.trim()
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("Chat error:", error);

        return res.status(500).json({
            message: "Unable to process chat request"
        });
    }
};
const deleteChatHistory = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (
            !conversationId ||
            !mongoose.Types.ObjectId.isValid(conversationId)
        ) {
            return res.status(400).json({
                message: "Invalid conversationId"
            });
        }

        const conversation = await Conversation.findOneAndDelete({
            _id: conversationId,
            user: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found"
            });
        }

        return res.status(200).json({
            message: "Conversation deleted successfully"
        });

    } catch (error) {
        console.error("Delete chat history error:", error);

        return res.status(500).json({
            message: "Unable to delete conversation"
        });
    }
};
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const { noteId } = req.query;

        const filter = {
            user: userId
        };

        if (noteId) {
            if (!mongoose.Types.ObjectId.isValid(noteId)) {
                return res.status(400).json({
                    message: "Invalid noteId"
                });
            }

            filter.note = noteId;
        }

        const conversations = await Conversation.find(filter)
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            conversations
        });

    } catch (error) {
        console.error("Get chat history error:", error);

        return res.status(500).json({
            message: "Unable to retrieve chat history"
        });
    }
};
module.exports = {
    chat,
    getChatHistory,
    deleteChatHistory
};
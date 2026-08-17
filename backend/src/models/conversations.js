const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const conversationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true
        },

        messages: {
            type: [messageSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index({ user: 1, note: 1 });

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);
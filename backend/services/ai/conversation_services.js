const Conversation = require("../../src/models/conversations.js");

async function getOrCreateConversation(userId, noteId) {
    let conversation = await Conversation.findOne({
        user: userId,
        note: noteId
    });

    if (!conversation) {
        conversation = await Conversation.create({
            user: userId,
            note: noteId,
            messages: []
        });
    }

    return conversation;
}

function getRecentMessages(conversation, limit = 10) {
    return conversation.messages.slice(-limit);
}

async function addMessage(conversation, role, content) {
    conversation.messages.push({
        role,
        content
    });

    await conversation.save();
}

module.exports = {
    getOrCreateConversation,
    getRecentMessages,
    addMessage
};
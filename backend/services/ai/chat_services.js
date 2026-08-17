const { getOrCreateConversation, getRecentMessages, addMessage } =
    require("./conversation_services");

const { retrieveChunks } = require("./retreival_services");

const { buildRagPrompt } = require("./prompt_service");

const { generateText } = require("../../src/utils/gemini");


async function chatWithPdf({ userId, noteId, message }) {

    // 1. Find or create the conversation
    const conversation = await getOrCreateConversation(
        userId,
        noteId
    );


    // 2. Get recent conversation history
    const recentMessages = getRecentMessages(
        conversation,
        10
    );


    // 3. Retrieve relevant PDF chunks
    const chunks = await retrieveChunks(
        message,
        {
            userId,
            noteId,
            limit: 5
        }
    );


    // 4. Build the RAG prompt
    const prompt = buildRagPrompt(
        message,
        chunks,
        recentMessages
    );


    // 5. Ask Gemini
    const answer = await generateText(prompt);


    // 6. Save user message
    await addMessage(
        conversation,
        "user",
        message
    );


    // 7. Save assistant response
    await addMessage(
        conversation,
        "assistant",
        answer
    );


    return {
        answer,
        sources: chunks.map(chunk => ({
            noteId: chunk.payload.noteId,
            chunkIndex: chunk.payload.chunkIndex,
            pageNumber: chunk.payload.pageNumber || null,
            score: chunk.score
        }))
    };
}


module.exports = {
    chatWithPdf
};
const qdrantClient = require("../../src/config/qdrant");
const { generateEmbedding } = require("./embedding_service");

const COLLECTION_NAME = "studyvault_chunks";

async function retrieveChunks(query, { userId, noteId, limit = 5 }) {
    const queryEmbedding = await generateEmbedding(query);

    const must = [
        {
            key: "userId",
            match: {
                value: userId
            }
        }
    ];

    if (noteId) {
        must.push({
            key: "noteId",
            match: {
                value: noteId
            }
        });
    }

    const results = await qdrantClient.query(COLLECTION_NAME, {
        query: queryEmbedding,
        limit,
        with_payload: true,
        filter: {
            must
        }
    });

    return results.points;
}

module.exports = {
    retrieveChunks
};
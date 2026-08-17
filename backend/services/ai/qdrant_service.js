const qdrantClient = require("../../src/config/qdrant");
const crypto = require("crypto");

const COLLECTION_NAME = "studyvault_chunks";

async function createCollection() {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some(
        collection => collection.name === COLLECTION_NAME
    );

    if (exists) {
        console.log(`Collection "${COLLECTION_NAME}" already exists.`);
        return;
    }

    await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 384,
            distance: "Cosine"
        }
    });

    console.log(`Collection "${COLLECTION_NAME}" created.`);
}
async function storeChunks(chunks, embeddings, metadata) {
    await createCollection();
    const points = chunks.map((chunk, index) => ({
        id: crypto.randomUUID(),

        vector: embeddings[index],

        payload: {
            text: chunk.text,
            noteId: metadata.noteId,
            userId: metadata.userId,
            chunkIndex: index,
            pageNumber: chunk.pageNumber
        }
    }));

    await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points
    });
}

async function getStoredChunks() {
    return await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10,
        with_payload: true,
        with_vector: false
    });
}

module.exports = {
    createCollection,
    storeChunks,
    getStoredChunks
};
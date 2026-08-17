const EMBEDDING_SERVER_URL =
    process.env.EMBEDDING_SERVER_URL || "http://127.0.0.1:8001";

async function generateEmbedding(text) {
    const response = await fetch(
        `${EMBEDDING_SERVER_URL}/embed?text=${encodeURIComponent(text)}`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        throw new Error(`Embedding server error: ${response.status}`);
    }

    const data = await response.json();

    return data.embedding;
}

module.exports = {
    generateEmbedding
};
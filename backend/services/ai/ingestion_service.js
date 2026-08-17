const extractTextFromPDF = require("../../src/utils/pdfExtractor");
const { chunkText } = require("./chunkingServices");
const { generateEmbedding } = require("./embedding_service");
const { storeChunks } = require("./qdrant_service");

async function ingestPdf(filePath) {
    // 1. Extract text
    const text = await extractTextFromPDF(filePath);

    // 2. Split text into chunks
    const chunks = chunkText(text);

    // 3. Generate embedding for each chunk
    const embeddings = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        embeddings.push(embedding);
    }

    return {
        chunks,
        embeddings
    };
}

async function ingestAndStoreText({ noteId, userId, text }) {
    if (!text || !text.trim()) {
        console.log("No text provided for ingestion.");
        return 0;
    }

    // 1. Split text by page markers
    const parts = text.split(/\[\[PAGE:(\d+)\]\]/);
    const pages = [];
    for (let i = 1; i < parts.length; i += 2) {
        const pageNum = parseInt(parts[i], 10);
        const pageText = parts[i + 1] || "";
        if (pageText.trim()) {
            pages.push({ pageNumber: pageNum, text: pageText });
        }
    }

    // If no page markers were found (fallback), treat as page 1
    if (pages.length === 0) {
        pages.push({ pageNumber: 1, text });
    }

    // 2. Chunk text page-by-page
    const chunks = [];
    for (const page of pages) {
        const pageChunks = chunkText(page.text);
        for (const chunkText of pageChunks) {
            chunks.push({
                text: chunkText,
                pageNumber: page.pageNumber
            });
        }
    }

    // 3. Generate embedding for each chunk
    const embeddings = [];
    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        embeddings.push(embedding);
    }

    // 4. Store chunks in Qdrant
    await storeChunks(chunks, embeddings, { noteId, userId });

    return chunks.length;
}

module.exports = {
    ingestPdf,
    ingestAndStoreText
};
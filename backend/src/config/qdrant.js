require("dotenv").config();

const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    port: 443,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false
});

module.exports = qdrantClient;
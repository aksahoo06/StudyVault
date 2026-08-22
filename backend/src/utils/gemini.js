const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

const model =
  genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

const generateText =
  async (prompt) => {

    const result =
      await model.generateContent(
        prompt
      );

    return result.response.text();
  };

const generateEmbedding = async (text) => {
  const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 384,
  });
  return result.embedding.values;
};

module.exports = {
  generateText,
  generateEmbedding,
};
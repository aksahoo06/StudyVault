function chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(/\s+/).filter(Boolean);

    const chunks = [];

    let start = 0;

    while (start < words.length) {
        const end = Math.min(start + chunkSize, words.length);

        chunks.push(words.slice(start, end).join(" "));

        if (end === words.length) {
            break;
        }

        start = end - overlap;
    }

    return chunks;
}

module.exports = {
    chunkText
};
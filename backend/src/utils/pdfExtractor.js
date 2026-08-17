const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractTextFromPDF = async (
  filePath
) => {
  // ORIGINAL:
  // if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
  //   const response = await fetch(filePath);
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
  //   }
  //   const arrayBuffer = await response.arrayBuffer();
  //   dataBuffer = Buffer.from(arrayBuffer);
  // } else {
  //   dataBuffer = fs.readFileSync(filePath);
  // }

  // CORRECT: Support Buffer input directly, fallback to URL/File extraction
  if (Buffer.isBuffer(filePath)) {
    dataBuffer = filePath;
  } else if (typeof filePath === "string" && (filePath.startsWith("http://") || filePath.startsWith("https://"))) {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    dataBuffer = Buffer.from(arrayBuffer);
  } else {
    dataBuffer = fs.readFileSync(filePath);
  }

  // Custom page renderer to inject page markers
  const render_page = (pageData) => {
    return pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false
    })
    .then((textContent) => {
      let text = `[[PAGE:${pageData.pageNumber}]] `;
      for (let item of textContent.items) {
        text += item.str + " ";
      }
      return text + "\n";
    });
  };

  // Original:
  // const data =
  //   await pdfParse(dataBuffer);
  const data = await pdfParse(dataBuffer, { pagerender: render_page });

  return data.text;
};

module.exports = extractTextFromPDF;
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: true,
    },

    pdfUrl: {
        type: String,
        required: true,
    },

    cloudinaryPublicId: {
        type: String,
        required: true,
    },

    extractedText: {
        type: String,
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Note",
  noteSchema
);
const mongoose = require("mongoose");

const flashcardSetSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: true,
      },

      cards: [
        {
          question: {
            type: String,
            required: true,
          },

          answer: {
            type: String,
            required: true,
          },
        },
      ],

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "FlashcardSet",
  flashcardSetSchema
);
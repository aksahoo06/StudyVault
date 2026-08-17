const mongoose = require("mongoose");

const testSchema =
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

      questions: [
        {
          question: String,

          options: [String],

          correctAnswer: String,
        },
      ],

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Test",
    testSchema
  );
const Note = require("../models/note");
const FlashcardSet = require("../models/flashcardSet");
const Test = require("../models/Test");
const {
  generateText,
} = require("../utils/gemini");

const generateFlashcards =
  async (req, res) => {
    try {
      const existingSet = await FlashcardSet.findOne({
        noteId: Note._id,
        user: req.user._id,
      });
      if (existingSet) {
        return res.status(200).json({
          message: "Flashcards already exist",
          flashcardSet: existingSet,
        });
      }
      const note = await Note.findById(
        req.params.id
      );
      if (!note) {
        return res.status(404).json({
          message: "Note not found",
        });
      }
      if (
        note.uploadedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
      const text =
        note.extractedText.slice(
          0,
          15000
        );
      const prompt = `
            Generate 10 flashcards from the text below.
            Return ONLY valid JSON.
            Format:
            [
                {
                    "question": "",
                    "answer": ""
                }
            ]
            Text:
            ${text}`;
      const airesponse = await generateText(prompt);
      const cleaned = airesponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const cards = JSON.parse(cleaned);
      const flashcardSet =
        await FlashcardSet.create({
          title:
            `${note.title} Flashcards`,

          noteId: note._id,

          cards,

          user:
            req.user._id,
        });

      res.status(201).json({
        message:
          "Flashcards generated successfully",
        flashcardSet,
      });
    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  };

const generateTest = async (req, res) => {
  try {
    const existingTest = await Test.findOne({
      noteId: req.params.id,
      user: req.user._id,
    });

    if (existingTest) {
      return res.status(200).json({
        message: "Quiz already exists",
        test: existingTest,
      });
    }

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    if (
      note.uploadedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const text =
      note.extractedText.slice(
        0,
        15000
      );

    const prompt = `
        Generate 5 MCQ questions.

        Return ONLY valid JSON.

        Format:

        [
        {
        "question":"",
        "options":[
            "",
            "",
            "",
            ""
        ],
        "correctAnswer":""
        }
        ]

        Text:

        ${text}
        `;

    const aiResponse =
      await generateText(prompt);

    const cleaned = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const questions =
      JSON.parse(cleaned);

    const test =
      await Test.create({
        title:
          `${note.title} Quiz`,

        noteId: note._id,

        questions,

        user: req.user._id,
      });

    res.status(201).json({
      message:
        "Quiz generated successfully",

      test,
    });
  }
  catch (error) {

    res.status(500).json({
      message:
        error.message,
    });
  }
}

const allTest = async (req, res) => {
  try {
    const tests = await Test.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 });
    res.status(200).json({
      tests
    });
  }
  catch (error) {

    res.status(500).json({
      message:
        error.message,
    });
  }
}

const singleTest = async (req, res) => {
  try {
    const test = await Test.findById(
      req.params.id
    );
    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }
    if (test.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    res.status(200).json({
      test
    });
  } catch (error) {
    res.status(500).json({
      message:
        error.message,
    });
  }
}

const deleteTest = async (
  req,
  res
) => {
  try {

    const test =
      await Test.findById(
        req.params.id
      );

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    if (
      test.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await test.deleteOne();

    res.status(200).json({
      message:
        "Test deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message:
        error.message,
    });

  }
};
module.exports = { generateFlashcards, generateTest, allTest, singleTest, deleteTest };
const FlashcardSet = require("../models/flashcardSet");

const createFlashcardSet =
  async (req, res) => {
    try {
        const {title,noteId,cards,} = req.body;
        if (
            !title ||
            !noteId ||
            !cards ||
            cards.length === 0
        ) {
            return res.status(400).json({
                message:
                "Title, note and cards are required",
            });
        }
        const flashcardSet =await FlashcardSet.create({
            title,
            noteId,
            cards,
            user: req.user._id,
        });
        res.status(201).json({
        message:"Flashcard set created successfully",
        flashcardSet,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

//get all flash cards
const getFlashcardSets =
  async (req, res) => {
    try {

      const flashcardSets =
        await FlashcardSet.find({
          user: req.user._id,
        }).populate("noteId", "title").sort({
          createdAt: -1,
        });

      res.status(200).json(
        flashcardSets
      );

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  // get one flashcard by id
const getFlashcardSet =
  async (req, res) => {
    try {

      const flashcardSet =
        await FlashcardSet.findById(
          req.params.id
        ).populate("noteId", "title");;

      if (!flashcardSet) {
        return res.status(404).json({
          message:
            "Flashcard set not found",
        });
      }

      if (
        flashcardSet.user.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      res.status(200).json(
        flashcardSet
      );

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  const deleteFlashcardSet =
  async (req, res) => {
    try {

      const flashcardSet =
        await FlashcardSet.findById(
          req.params.id
        );

      if (!flashcardSet) {
        return res.status(404).json({
          message:
            "Flashcard set not found",
        });
      }

      if (
        flashcardSet.user.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      await flashcardSet.deleteOne();

      res.status(200).json({
        message:
          "Flashcard set deleted successfully",
      });

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
const updateFlashcardSet =
  async (req, res) => {
    try {

      const flashcardSet =
        await FlashcardSet.findById(
          req.params.id
        );

      if (!flashcardSet) {
        return res.status(404).json({
          message:
            "Flashcard set not found",
        });
      }

      if (
        flashcardSet.user.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const {
        title,
        cards,
      } = req.body;

      flashcardSet.title =
        title || flashcardSet.title;

      flashcardSet.cards =
        cards || flashcardSet.cards;

      await flashcardSet.save();

      res.status(200).json({
        message:
          "Flashcard set updated successfully",
        flashcardSet,
      });

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  module.exports={createFlashcardSet,getFlashcardSet,getFlashcardSets,deleteFlashcardSet,updateFlashcardSet};
const Note = require("../models/note");

const FlashcardSet = require("../models/flashcardSet");

const getDashboard =
  async (req, res) => {
    try {

      const totalPDFs =
        await Note.countDocuments({
          uploadedBy:
            req.user._id,
        });

      const totalFlashcardSets =
        await FlashcardSet.countDocuments({
          user:
            req.user._id,
        });

      const recentUploads =
        await Note.find({
          uploadedBy:
            req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(5);

      res.status(200).json({
        totalPDFs,
        totalFlashcardSets,
        recentUploads,
      });

    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

module.exports = {
  getDashboard,
};
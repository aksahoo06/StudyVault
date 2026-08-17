const express=require("express");
const router = express.Router();
const {protect}= require("../middleware/authMiddleware.js");
const {
  createFlashcardSet,
  getFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet,
  updateFlashcardSet
} = require("../controllers/flashcardController");


router.post("/", protect, createFlashcardSet);
router.get("/", protect, getFlashcardSets);
router.get("/:id", protect, getFlashcardSet);
router.put("/:id",updateFlashcardSet);
router.delete("/:id",protect,deleteFlashcardSet);

module.exports=router;
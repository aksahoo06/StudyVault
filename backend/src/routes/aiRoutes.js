const {generateFlashcards,generateTest,allTest,singleTest,deleteTest} = require(
  "../controllers/aiController"
);
const {
  protect,
} = require(
  "../middleware/authMiddleware"
);
const express = require("express");
const router = express.Router();

router.post(
  "/flashcards/:id",
  protect,
  generateFlashcards
);
router.post("/test/:id",protect,generateTest);
router.get("/test",protect,allTest);
router.get("/test/:id",protect,singleTest);
router.delete("/test/:id",protect,deleteTest);

module.exports=router;
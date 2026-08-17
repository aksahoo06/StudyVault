const express = require("express");
const router = express.Router();

const {uploadNote,getNotes,getSingleNote,deleteNote} = require("../controllers/noteController.js");
const {protect}= require("../middleware/authMiddleware.js");
const upload=require("../middleware/uploadMiddleware.js");

router.get("/",protect,getNotes);
router.get("/:id",protect,getSingleNote);
router.post("/upload",protect,upload.single("pdf"),uploadNote);
router.delete("/:id",protect,deleteNote);

module.exports = router;
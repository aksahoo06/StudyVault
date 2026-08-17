const express = require("express");
const router = express.Router();
const {protect}= require("../middleware/authMiddleware.js");
const {registerUser,loginUser,getCurrentUser}= require("../controllers/authController.js");

router.post("/register", registerUser);

router.post("/login", loginUser);
router.get("/me",protect,getCurrentUser);

module.exports = router;
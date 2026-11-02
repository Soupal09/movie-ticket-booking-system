const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyEmail
} = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);

module.exports = router;
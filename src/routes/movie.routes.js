
const express = require("express");

const {
  protect,
  authorize
} = require("../middleware/auth.middleware");

const {
  addMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie
} = require("../controllers/movie.controller");

const router = express.Router();

// Public routes
router.get("/", getMovies);
router.get("/:id", getMovieById);

// Admin-only routes
router.post("/", protect, authorize("Admin"), addMovie);

router.patch("/:id", protect, authorize("Admin"), updateMovie);

router.delete("/:id", protect, authorize("Admin"), deleteMovie);

module.exports = router;

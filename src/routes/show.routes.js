
const express = require("express");

const {
  addShow,
  getShows,
  getShowById,
  updateShow,
  deleteShow,
} = require("../controllers/show.controller");

const router = express.Router();

// GET /api/shows
router.get("/", getShows);

// GET /api/shows/:id
router.get("/:id", getShowById);

// POST /api/shows
router.post("/", addShow);

// PATCH /api/shows/:id
router.patch("/:id", updateShow);

// DELETE /api/shows/:id
router.delete("/:id", deleteShow);

module.exports = router;

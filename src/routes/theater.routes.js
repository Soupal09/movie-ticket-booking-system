
const express = require("express");

const {
  addTheater,
  getTheaters,
  getTheaterById,
  updateTheater,
  deleteTheater,
} = require("../controllers/theater.controller");

const router = express.Router();

// GET /api/theaters
router.get("/", getTheaters);

// GET /api/theaters/:id
router.get("/:id", getTheaterById);

// POST /api/theaters
router.post("/", addTheater);

// PATCH /api/theaters/:id
router.patch("/:id", updateTheater);

// DELETE /api/theaters/:id
router.delete("/:id", deleteTheater);

module.exports = router;

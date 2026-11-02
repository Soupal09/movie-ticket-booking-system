
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking
} = require("../controllers/booking.controller");

router.post("/", protect, createBooking);
router.get("/", protect, getAllBookings);
router.get("/:id", protect, getBookingById);
router.patch("/:id", protect, updateBooking);
router.delete("/:id", protect, cancelBooking);

module.exports = router;

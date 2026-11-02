const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Show = require("../models/Show");

const populateBooking = (query) => {
  return query.populate({
    path: "show",
    populate: [{ path: "movie" }, { path: "theater" }],
  });
};

const createBooking = async (req, res) => {
  let reservedShowId;
  let reservedQuantity = 0;

  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { showId, quantity } = req.body;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const ticketQuantity = Number(quantity);

    const show = await Show.findOneAndUpdate(
      {
        _id: showId,
        availableSeats: { $gte: ticketQuantity },
      },
      {
        $inc: { availableSeats: -ticketQuantity },
      },
      { new: true },
    );

    if (!show) {
      const existingShow = await Show.findById(showId);

      if (!existingShow) {
        return res.status(404).json({
          success: false,
          message: "Show not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Not enough available seats",
      });
    }

    reservedShowId = show._id;
    reservedQuantity = ticketQuantity;

    const booking = await Booking.create({
      user: req.user.userId,
      show: show._id,
      quantity: ticketQuantity,
      totalPrice: show.ticketPrice * ticketQuantity,
    });

    reservedQuantity = 0;

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
      remainingSeats: show.availableSeats,
    });
  } catch (error) {
    if (reservedShowId && reservedQuantity > 0) {
      await Show.updateOne(
        { _id: reservedShowId },
        { $inc: { availableSeats: reservedQuantity } },
      ).catch((rollbackError) => {
        console.error("Seat rollback error:", rollbackError);
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await populateBooking(
      Booking.find({ user: req.user.userId }).sort({ createdAt: -1 }),
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await populateBooking(
      Booking.findOne({
        _id: id,
        user: req.user.userId,
      }),
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const newQuantity = Number(quantity);

    const booking = await Booking.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Cancelled bookings cannot be updated",
      });
    }

    const oldQuantity = booking.quantity;
    const difference = newQuantity - oldQuantity;

    if (difference === 0) {
      return res.status(200).json({
        success: true,
        message: "Booking quantity is unchanged",
        booking,
      });
    }

    const show =
      difference > 0
        ? await Show.findOneAndUpdate(
            {
              _id: booking.show,
              availableSeats: { $gte: difference },
            },
            {
              $inc: { availableSeats: -difference },
            },
            { new: true },
          )
        : await Show.findOneAndUpdate(
            { _id: booking.show },
            { $inc: { availableSeats: -difference } },
            { new: true },
          );

    if (!show) {
      const existingShow = await Show.findById(booking.show);

      if (!existingShow) {
        return res.status(404).json({
          success: false,
          message: "Associated show not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Not enough available seats",
      });
    }

    try {
      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: id,
          user: req.user.userId,
          status: "confirmed",
          quantity: oldQuantity,
        },
        {
          $set: {
            quantity: newQuantity,
            totalPrice: show.ticketPrice * newQuantity,
          },
        },
        { new: true, runValidators: true },
      );

      if (!updatedBooking) {
        await Show.updateOne(
          { _id: show._id },
          { $inc: { availableSeats: difference } },
        );

        return res.status(409).json({
          success: false,
          message: "Booking changed during update. Please retry.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        booking: updatedBooking,
        remainingSeats: show.availableSeats,
      });
    } catch (error) {
      await Show.updateOne(
        { _id: show._id },
        { $inc: { availableSeats: difference } },
      );

      throw error;
    }
  } catch (error) {
    console.error("Update booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const cancelledBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        user: req.user.userId,
        status: "confirmed",
      },
      {
        $set: { status: "cancelled" },
      },
      { new: true },
    );

    if (!cancelledBooking) {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled or has changed",
      });
    }

    const show = await Show.findOneAndUpdate(
      { _id: booking.show },
      { $inc: { availableSeats: booking.quantity } },
      { new: true },
    );

    if (!show) {
      await Booking.updateOne(
        {
          _id: id,
          user: req.user.userId,
          status: "cancelled",
        },
        { $set: { status: "confirmed" } },
      );

      return res.status(404).json({
        success: false,
        message: "Associated show not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
      restoredSeats: booking.quantity,
      remainingSeats: show.availableSeats,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
};

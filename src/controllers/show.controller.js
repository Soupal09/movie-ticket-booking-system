
const mongoose = require("mongoose");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const Theater = require("../models/Theater");

// Helper: validate MongoDB ObjectId
const isValidId = (id) => mongoose.isValidObjectId(id);

// Helper: validate show data
const validateShowData = (data, isCreate = false) => {
  const errors = [];
  const has = (key) =>
    Object.prototype.hasOwnProperty.call(data, key);

  if (isCreate || has("movie")) {
    if (!data.movie || !isValidId(data.movie)) {
      errors.push("Valid movie ID is required");
    }
  }

  if (isCreate || has("theater")) {
    if (!data.theater || !isValidId(data.theater)) {
      errors.push("Valid theater ID is required");
    }
  }

  if (isCreate || has("showDate")) {
    if (
      typeof data.showDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.showDate) ||
      Number.isNaN(Date.parse(`${data.showDate}T00:00:00Z`)) ||
      new Date(`${data.showDate}T00:00:00Z`)
        .toISOString().slice(0, 10) !== data.showDate
    ) {
      errors.push("showDate must be a valid YYYY-MM-DD date");
    }
  }

  if (isCreate || has("showTime")) {
    if (
      typeof data.showTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.showTime)
    ) {
      errors.push("showTime must be in HH:mm format");
    }
  }

  if (isCreate || has("ticketPrice")) {
    const price = data.ticketPrice;

    if (
      price === "" ||
      price === null ||
      price === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 1
    ) {
      errors.push("Ticket price must be at least 1");
    }
  }

  if (isCreate || has("availableSeats")) {
    const seats = data.availableSeats;

    if (
      seats === "" ||
      seats === null ||
      seats === undefined ||
      !Number.isInteger(Number(seats)) ||
      Number(seats) < 0
    ) {
      errors.push("Available seats must be a non-negative integer");
    }
  }

  return errors;
};

// 1. CREATE SHOW
const addShow = async (req, res) => {
  try {
    const errors = validateShowData(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid show data",
        errors,
      });
    }

    const {
      movie,
      theater,
      showDate,
      showTime,
      ticketPrice,
      availableSeats,
    } = req.body;

    const [movieExists, theaterExists] = await Promise.all([
      Movie.exists({ _id: movie }),
      Theater.exists({ _id: theater }),
    ]);

    if (!movieExists) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    if (!theaterExists) {
      return res.status(404).json({
        success: false,
        message: "Theater not found",
      });
    }

    const show = await Show.create({
      movie,
      theater,
      showDate,
      showTime,
      ticketPrice: Number(ticketPrice),
      availableSeats: Number(availableSeats),
    });

    const populatedShow = await Show.findById(show._id)
      .populate("movie")
      .populate("theater");

    return res.status(201).json({
      success: true,
      message: "Show created successfully",
      show: populatedShow,
    });
  } catch (error) {
    console.error("Add show error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create show",
    });
  }
};

// 2. GET ALL SHOWS
const getShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("movie")
      .populate("theater")
      .sort({ showDate: 1, showTime: 1 });

    return res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error("Get shows error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shows",
    });
  }
};

// 3. GET SHOW BY ID
const getShowById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
    }

    const show = await Show.findById(id)
      .populate("movie")
      .populate("theater");

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Show fetched successfully",
      show,
    });
  } catch (error) {
    console.error("Get show error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch show",
    });
  }
};

// 4. UPDATE SHOW (PATCH)
const updateShow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
    }

    const allowedFields = [
      "movie",
      "theater",
      "showDate",
      "showTime",
      "ticketPrice",
      "availableSeats",
    ];

    const keys = Object.keys(req.body);

    if (
      keys.length === 0 ||
      keys.some((key) => !allowedFields.includes(key))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid show fields to update",
      });
    }

    const errors = validateShowData(req.body, false);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid show data",
        errors,
      });
    }

    const existingShow = await Show.findById(id);

    if (!existingShow) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    if (req.body.movie !== undefined) {
      const movieExists = await Movie.exists({
        _id: req.body.movie,
      });

      if (!movieExists) {
        return res.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }
    }

    if (req.body.theater !== undefined) {
      const theaterExists = await Theater.exists({
        _id: req.body.theater,
      });

      if (!theaterExists) {
        return res.status(404).json({
          success: false,
          message: "Theater not found",
        });
      }
    }

    const updateData = { ...req.body };

    if (updateData.ticketPrice !== undefined) {
      updateData.ticketPrice = Number(updateData.ticketPrice);
    }

    if (updateData.availableSeats !== undefined) {
      updateData.availableSeats = Number(updateData.availableSeats);
    }

    const show = await Show.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("movie")
      .populate("theater");

    return res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show,
    });
  } catch (error) {
    console.error("Update show error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update show",
    });
  }
};

// 5. DELETE SHOW
const deleteShow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
    }

    const show = await Show.findByIdAndDelete(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("Delete show error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete show",
    });
  }
};

module.exports = {
  addShow,
  getShows,
  getShowById,
  updateShow,
  deleteShow,
};

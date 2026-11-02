
const mongoose = require("mongoose");
const Theater = require("../models/Theater");

// 1. Add Theater
const addTheater = async (req, res) => {
  try {
    const { name, location, numberOfScreens } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !location ||
      typeof location !== "object" ||
      Array.isArray(location) ||
      typeof location.city !== "string" ||
      !location.city.trim() ||
      typeof location.address !== "string" ||
      !location.address.trim() ||
      numberOfScreens === undefined ||
      numberOfScreens === null ||
      numberOfScreens === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid theater details",
      });
    }

    const screens = Number(numberOfScreens);

    if (!Number.isInteger(screens) || screens < 1) {
      return res.status(400).json({
        success: false,
        message: "Number of screens must be a positive integer",
      });
    }

    const theater = await Theater.create({
      name: name.trim(),
      location: {
        city: location.city.trim(),
        address: location.address.trim(),
      },
      numberOfScreens: screens,
    });

    return res.status(201).json({
      success: true,
      message: "Theater added successfully",
      theater,
    });
  } catch (error) {
    console.error("Add theater error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add theater",
    });
  }
};

// 2. Get All Theaters
const getTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: theaters.length,
      theaters,
    });
  } catch (error) {
    console.error("Get theaters error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch theaters",
    });
  }
};

// 3. Get Theater By ID
const getTheaterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theater ID",
      });
    }

    const theater = await Theater.findById(id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: "Theater not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Theater fetched successfully",
      theater,
    });
  } catch (error) {
    console.error("Get theater by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch theater",
    });
  }
};

// 4. Update Theater
const updateTheater = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theater ID",
      });
    }

    const { name, location, numberOfScreens } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      updateData.name = name.trim();
    }

    if (location !== undefined) {
      if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location)
      ) {
        return res.status(400).json({
          success: false,
          message: "Location must be an object",
        });
      }

      if (location.city !== undefined) {
        if (
          typeof location.city !== "string" ||
          !location.city.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: "City must be a non-empty string",
          });
        }

        updateData["location.city"] = location.city.trim();
      }

      if (location.address !== undefined) {
        if (
          typeof location.address !== "string" ||
          !location.address.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: "Address must be a non-empty string",
          });
        }

        updateData["location.address"] = location.address.trim();
      }

      if (
        location.city === undefined &&
        location.address === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide city or address to update",
        });
      }
    }

    if (numberOfScreens !== undefined) {
      if (
        numberOfScreens === null ||
        numberOfScreens === "" ||
        !Number.isInteger(Number(numberOfScreens)) ||
        Number(numberOfScreens) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Number of screens must be a positive integer",
        });
      }

      updateData.numberOfScreens = Number(numberOfScreens);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const theater = await Theater.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: "Theater not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Theater updated successfully",
      theater,
    });
  } catch (error) {
    console.error("Update theater error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update theater",
    });
  }
};

// 5. Delete Theater
const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theater ID",
      });
    }

    const theater = await Theater.findByIdAndDelete(id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: "Theater not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Theater deleted successfully",
    });
  } catch (error) {
    console.error("Delete theater error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete theater",
    });
  }
};

module.exports = {
  addTheater,
  getTheaters,
  getTheaterById,
  updateTheater,
  deleteTheater,
};

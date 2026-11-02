const mongoose = require("mongoose");

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Theater name is required"],
      trim: true,
    },

    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },

      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
      },
    },

    numberOfScreens: {
      type: Number,
      required: [true, "Number of screens is required"],
      min: [1, "At least one screen is required"],
      validate: {
        validator: Number.isInteger,
        message: "Number of screens must be an integer",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theater", theaterSchema);
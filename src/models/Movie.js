const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    genre: {
      type: [String],
      required: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    cast: {
      type: [String],
      default: [],
    },

    director: {
      type: String,
      required: true,
      trim: true,
    },

    releaseDate: {
      type: Date,
      required: true,
    },

    poster: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
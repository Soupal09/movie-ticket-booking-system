
const Movie = require("../models/Movie");

const addMovie = async (req, res) => {
  try {
    const {
      name,
      genre,
      language,
      duration,
      cast,
      director,
      releaseDate,
    } = req.body;

    if (
      !name ||
      !genre ||
      !language ||
      !duration ||
      !director ||
      !releaseDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required movie details",
      });
    }

    const movie = await Movie.create({
      name,
      genre,
      language,
      duration,
      cast,
      director,
      releaseDate,
    });

    return res.status(201).json({
      success: true,
      message: "Movie added successfully",
      movie,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to add movie",
    });
  }
};

const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
    });
  }
};

const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update movie",
    });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete movie",
    });
  }
};


const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID"
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie fetched successfully",
      movie
    });
  } catch (error) {
    console.error("Get movie by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch movie"
    });
  }
};


module.exports = {
  addMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie
};

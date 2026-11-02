const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const theaterRoutes = require("./routes/theater.routes");
const showRoutes = require("./routes/show.routes");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/theaters", theaterRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Movie Ticket Booking API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

module.exports = app;

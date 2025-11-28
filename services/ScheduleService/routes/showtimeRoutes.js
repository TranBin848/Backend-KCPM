const express = require("express");
const router = express.Router();
const { fetchRoomsByTheater } = require("../APIs/theaterAPI");
const { fetchMovieById } = require("../APIs/movieAPI");
const Showtime = require("../models/Showtime");
const createShowtimeController = require("../controllers/showtimeController");

const showtimeController = createShowtimeController({
  Showtime,
  fetchMovieById,
  fetchRoomsByTheater,
});

router.post("/", showtimeController.createShowtime);

router.post("/generate-showtimes", showtimeController.generateShowtimes);

// API để lấy danh sách suất chiếu
router.get("/", showtimeController.getShowtimes);

// Lấy thông tin chi tiết 1 suất chiếu theo ID
router.get("/:id", showtimeController.getShowtimeById);

router.patch("/update-prices", showtimeController.updateShowtimePrices);

router.delete("/:id", showtimeController.deleteShowtime);

module.exports = router;

router.delete("/:id", showtimeController.deleteShowtime);

module.exports = router;

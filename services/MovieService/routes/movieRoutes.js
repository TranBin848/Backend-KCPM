const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const multer = require("multer");
const createMovieController = require("../controllers/movieController");

// Initialize controller with dependencies
const movieController = createMovieController({ Movie });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // thư mục lưu ảnh
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Lấy danh sách tất cả phim
router.get("/", movieController.getAllMovies);

// Lấy phim theo ID
router.get("/:id", movieController.getMovieById);

// Thêm phim mới
router.post("/", upload.single("poster"), movieController.createMovie);

// Cập nhật phim theo ID
router.put("/:id", upload.single("poster"), movieController.updateMovie);

// Xóa phim theo ID
router.delete("/:id", movieController.deleteMovie);

module.exports = router;

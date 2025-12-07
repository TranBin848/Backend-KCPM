//theaterRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const createTheaterController = require("../controllers/theaterController/index");

const theaterController = createTheaterController({ pool });

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder lưu ảnh
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Get all theaters
router.get("/", theaterController.getAllTheaters);

// Get single theater by ID
router.get("/:id", theaterController.getTheaterById);

// Get all gallery images by theater ID
router.get("/:id/gallery", theaterController.getTheaterGallery);

// Create new theater
router.post("/", upload.array("gallery", 10), theaterController.createTheater);

// Update theater
router.put("/:id", upload.array("gallery", 10), theaterController.updateTheater);

// Delete theater
router.delete("/:id", theaterController.deleteTheater);

module.exports = router;

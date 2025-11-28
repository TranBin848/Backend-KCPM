const express = require("express");
const router = express.Router();
const pool = require("../db");
const createSeatController = require("../controllers/seatController");

const seatController = createSeatController({ pool });

// API tạo ghế cho phòng chiếu đã có sẵn
router.post("/generate", seatController.generateSeats);

// GET /api/seats/:id - lấy thông tin chi tiết 1 ghế
router.get("/:id", seatController.getSeatById);

// GET /api/seats/room/:room_id
router.get("/room/:room_id", seatController.getSeatsByRoom);

// PUT /api/seats/:id/type
router.put("/:id/type", seatController.updateSeatType);

// PUT /api/seats/:id/status
router.put("/:id/status", seatController.updateSeatStatus);

module.exports = router;

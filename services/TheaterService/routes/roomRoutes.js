// Import các thư viện cần thiết
const express = require("express");
const router = express.Router();
const pool = require("../db");
const createRoomController = require("../controllers/roomController/index");

const roomController = createRoomController({ pool });

// API tạo phòng chiếu
router.post("/", roomController.createRoom);

// API cập nhật thông tin phòng chiếu
router.put("/:roomId", roomController.updateRoom);

// API xóa phòng chiếu
router.delete("/:roomId", roomController.deleteRoom);

// API lấy danh sách các phòng theo rạp và tên của rạp
router.get("/theater/:theaterId", roomController.getRoomsByTheater);

module.exports = router;

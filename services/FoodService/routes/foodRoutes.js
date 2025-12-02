const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const multer = require("multer");
const createFoodController = require("../controllers/foodController/index");
const foodController = createFoodController({ Food });

// Cấu hình multer để lưu ảnh
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

// --- Lấy danh sách tất cả món ăn (có thể lọc isAvailable)
router.get("/", foodController.getAllFoods);

// --- Lấy món ăn theo ID
router.get("/:id", foodController.getFoodById);

// --- Thêm món ăn mới
router.post("/", upload.single("image"), foodController.createFood);

// --- Cập nhật món ăn theo ID
router.put("/:id", upload.single("image"), foodController.updateFood);

// --- Xóa món ăn theo ID
router.delete("/:id", foodController.deleteFood);

module.exports = router;

const express = require("express");
const router = express.Router();
const Promotion = require("../models/Promotion");
const multer = require("multer");
const createPromotionController = require("../controllers/promotionController");
const promotionController = createPromotionController({ Promotion });

// --- Cấu hình lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// --- Lấy danh sách tất cả ưu đãi
router.get("/", promotionController.getAllPromotions);

// --- Lấy ưu đãi theo ID
router.get("/:id", promotionController.getPromotionById);

// --- Thêm ưu đãi mới
router.post("/", upload.single("image"), promotionController.createPromotion);

// --- Cập nhật ưu đãi
router.put("/:id", upload.single("image"), promotionController.updatePromotion);

// --- Xóa ưu đãi
router.delete("/:id", promotionController.deletePromotion);

module.exports = router;

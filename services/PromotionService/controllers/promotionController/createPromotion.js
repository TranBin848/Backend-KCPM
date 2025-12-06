const path = require("path");

// Thêm ưu đãi mới
const createPromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      let promoData = {};

      // Nếu gửi form-data
      if (req.body.data) {
        try {
          promoData = JSON.parse(req.body.data);
        } catch {
          return res
            .status(400)
            .json({ error: "Dữ liệu JSON trong 'data' không hợp lệ" });
        }
      } else {
        // Gửi JSON thuần
        promoData = req.body;
      }

      if (req.file) {
        promoData.image = path.join("uploads", req.file.filename);
      }

      if (!promoData.title || !promoData.description) {
        return res
          .status(400)
          .json({ error: "Thiếu trường bắt buộc: title hoặc description" });
      }

      const newPromotion = new Promotion(promoData);
      await newPromotion.save();

      res
        .status(201)
        .json({
          message: "Thêm ưu đãi thành công",
          promotion: newPromotion,
        });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi thêm ưu đãi", details: err.message });
    }
  };
};

module.exports = createPromotion;


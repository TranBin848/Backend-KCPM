const mongoose = require("mongoose");
const path = require("path");

// Cập nhật ưu đãi
const updatePromotion = ({ Promotion }) => {
  return async (req, res) => {
    try {
      const promotionId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(promotionId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      let updateData = {};
      if (req.body.data) {
        try {
          updateData = JSON.parse(req.body.data);
        } catch {
          return res
            .status(400)
            .json({ error: "Dữ liệu JSON trong 'data' không hợp lệ" });
        }
      } else {
        updateData = req.body;
      }

      if (req.file) {
        updateData.image = path.join("uploads", req.file.filename);
      }

      const updatedPromotion = await Promotion.findByIdAndUpdate(
        promotionId,
        updateData,
        {
          new: true,
        }
      );

      if (!updatedPromotion) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy ưu đãi để cập nhật" });
      }

      res.json(updatedPromotion);
    } catch (err) {
      res.status(500).json({ error: "Lỗi máy chủ", details: err.message });
    }
  };
};

module.exports = updatePromotion;


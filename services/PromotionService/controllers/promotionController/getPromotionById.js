const mongoose = require("mongoose");

// Lấy ưu đãi theo ID
const getPromotionById = ({ Promotion }) => {
  return async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    try {
      const promotion = await Promotion.findById(id);
      if (!promotion)
        return res.status(404).json({ error: "Không tìm thấy ưu đãi" });
      res.json(promotion);
    } catch (err) {
      res.status(500).json({ error: "Lỗi khi lấy ưu đãi" });
    }
  };
};

module.exports = getPromotionById;


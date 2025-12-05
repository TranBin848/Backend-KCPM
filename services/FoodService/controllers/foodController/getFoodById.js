const mongoose = require("mongoose");

/**
 * Get a single food item by ID
 * @param {Object} dependencies - { Food }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ Food }) => {
  return async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    try {
      const food = await Food.findById(id);
      if (!food) {
        return res.status(404).json({ error: "Không tìm thấy món ăn" });
      }
      res.json(food);
    } catch (err) {
      res.status(500).json({ error: "Lỗi khi lấy món ăn" });
    }
  };
};

const mongoose = require("mongoose");
const path = require("path");

/**
 * Update an existing food item by ID
 * Supports image upload replacement
 * @param {Object} dependencies - { Food }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ Food }) => {
  return async (req, res) => {
    try {
      const foodId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(foodId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const updateData = JSON.parse(req.body.data || "{}");

      // If there's a new uploaded image
      if (req.file) {
        updateData.imageUrl = path.join("uploads", req.file.filename);
      }

      const updatedFood = await Food.findByIdAndUpdate(foodId, updateData, {
        new: true,
      });

      if (!updatedFood) {
        return res.status(404).json({ error: "Món ăn không tồn tại" });
      }

      res.json(updatedFood);
    } catch (err) {
      res.status(500).json({ error: "Lỗi máy chủ", details: err.message });
    }
  };
};

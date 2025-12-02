/**
 * Get all foods with optional filtering by availability
 * @param {Object} dependencies - { Food }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ Food }) => {
  return async (req, res) => {
    try {
      const isAvailable = req.query.isAvailable;
      const filter = {};
      
      // Only filter if value is explicitly "true" or "false"
      if (isAvailable === "true") {
        filter.isAvailable = true;
      } else if (isAvailable === "false") {
        filter.isAvailable = false;
      }

      const foods = await Food.find(filter);
      res.json(foods);
    } catch (err) {
      res.status(500).json({ error: "Lỗi lấy danh sách món ăn" });
    }
  };
};

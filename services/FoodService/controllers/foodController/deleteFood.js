/**
 * Delete a food item by ID
 * @param {Object} dependencies - { Food }
 * @returns {Function} Express middleware handler
 */
module.exports = ({ Food }) => {
  return async (req, res) => {
    try {
      const deleted = await Food.findByIdAndDelete(req.params.id);
      
      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy món ăn để xóa" });
      }
      
      res.json({ message: "Xóa món ăn thành công" });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi xóa món ăn", details: err.message });
    }
  };
};

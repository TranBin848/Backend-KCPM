/**
 * Delete Movie Handler
 * DELETE /api/movies/:id
 */
module.exports = ({ Movie }) => {
  return async (req, res) => {
    try {
      const deleted = await Movie.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy phim để xóa" });
      }
      res.json({ message: "Xóa phim thành công" });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi xóa phim", details: err.message });
    }
  };
};

/**
 * Get Movie By ID Handler
 * GET /api/movies/:id
 */
const mongoose = require("mongoose");

module.exports = ({ Movie }) => {
  return async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    try {
      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({ error: "Không tìm thấy phim" });
      }
      res.json(movie);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi khi lấy phim" });
    }
  };
};

/**
 * Get All Movies Handler
 * GET /api/movies
 */
module.exports = ({ Movie }) => {
  return async (req, res) => {
    try {
      const status = req.query.status; // Lọc theo trạng thái nếu có
      const movies = status
        ? await Movie.find({ status })
        : await Movie.find();
      res.json(movies);
    } catch (err) {
      res.status(500).json({ error: "Lỗi lấy danh sách phim" });
    }
  };
};

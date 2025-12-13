/**
 * Update Movie Handler
 * PUT /api/movies/:id
 */
module.exports = ({ Movie }) => {
  return async (req, res) => {
    try {
      const movieId = req.params.id;      
      const parsedData = JSON.parse(req.body.data || "{}");

      // Validation Logic Added
      if (parsedData.title !== undefined && (!parsedData.title || parsedData.title.trim() === "")) {
        return res.status(400).json({ error: "Tên phim không được để trống" });
      }



      // Nếu có file mới thì thêm path ảnh mới
      if (req.file) {
        parsedData.poster = `uploads/${req.file.filename}`;
      }

      const updatedMovie = await Movie.findByIdAndUpdate(movieId, parsedData, {
        new: true,
        runValidators: true // Enforce Schema Validation
      });

      if (!updatedMovie) {
        return res.status(404).json({ error: "Phim không tồn tại" });
      }

      res.json(updatedMovie);
    } catch (err) {
      console.error("Lỗi cập nhật phim:", err);
      res.status(500).json({ error: "Lỗi máy chủ" });
    }
  };
};

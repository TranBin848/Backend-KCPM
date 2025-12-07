/**
 * Create Movie Handler
 * POST /api/movies
 */
module.exports = ({ Movie }) => {
  return async (req, res) => {
    try {
      const movieData = JSON.parse(req.body.data);
      const posterUrl = req.file ? `uploads/${req.file.filename}` : null;
      movieData.poster = posterUrl;

      const newMovie = new Movie(movieData);
      await newMovie.save();

      res
        .status(201)
        .json({ message: "Thêm phim thành công", movie: newMovie });
    } catch (err) {
      res
        .status(400)
        .json({ error: "Lỗi khi thêm phim", details: err.message });
    }
  };
};

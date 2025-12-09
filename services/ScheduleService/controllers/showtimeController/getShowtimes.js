// Lấy danh sách suất chiếu
const getShowtimes = ({ Showtime }) => {
  return async (req, res) => {
    try {
      const { theaterId, roomId, date, movieId } = req.query;

      const query = {};

      if (theaterId) {
        query["theater.theaterId"] = theaterId;
      }

      if (roomId) {
        query["room.roomId"] = roomId;
      }

      if (date) {
        query.date = new Date(date);
      }

      if (movieId) {
        query["movie.movieId"] = movieId;
      }

      const showtimes = await Showtime.find(query).sort({ startTime: 1 });

      if (showtimes.length === 0) {
        return res
          .status(404)
          .json({ error: "Không có suất chiếu nào phù hợp" });
      }

      res.status(200).json({ showtimes });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin suất chiếu:", error.message);
      res.status(500).json({ error: "Lỗi khi lấy thông tin suất chiếu" });
    }
  };
};

module.exports = getShowtimes;


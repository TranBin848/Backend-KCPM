// Lấy thông tin chi tiết 1 suất chiếu theo ID
const getShowtimeById = ({ Showtime }) => {
  return async (req, res) => {
    const { id } = req.params;

    try {
      const showtime = await Showtime.findById(id);

      if (!showtime) {
        return res.status(404).json({ error: "Không tìm thấy suất chiếu" });
      }

      res.status(200).json({ showtime });
    } catch (error) {
      console.error("Lỗi khi lấy suất chiếu:", error.message);
      res.status(500).json({ error: "Lỗi khi lấy thông tin suất chiếu" });
    }
  };
};

module.exports = getShowtimeById;


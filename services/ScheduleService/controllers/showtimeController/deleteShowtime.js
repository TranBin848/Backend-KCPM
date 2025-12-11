// Xóa suất chiếu
const deleteShowtime = ({ Showtime }) => {
  return async (req, res) => {
    const { id } = req.params;

    try {
      const deleted = await Showtime.findByIdAndDelete(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy suất chiếu để xoá" });
      }

      res.status(200).json({ message: "Xoá suất chiếu thành công" });
    } catch (error) {
      console.error("Lỗi khi xoá suất chiếu:", error.message);
      res.status(500).json({ error: "Lỗi server khi xoá suất chiếu" });
    }
  };
};

module.exports = deleteShowtime;


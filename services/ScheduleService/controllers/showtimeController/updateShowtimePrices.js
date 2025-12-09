// Cập nhật giá cho nhiều suất chiếu
const updateShowtimePrices = ({ Showtime }) => {
  return async (req, res) => {
    const { showtimeIds, priceRegular, priceVIP } = req.body;

    if (!Array.isArray(showtimeIds) || showtimeIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Danh sách suất chiếu không hợp lệ" });
    }

    if (priceRegular == null && priceVIP == null) {
      return res
        .status(400)
        .json({ error: "Cần cung cấp ít nhất một loại giá để cập nhật" });
    }

    try {
      const updateFields = {};
      if (priceRegular != null) updateFields.priceRegular = priceRegular;
      if (priceVIP != null) updateFields.priceVIP = priceVIP;

      const result = await Showtime.updateMany(
        { _id: { $in: showtimeIds } },
        { $set: updateFields }
      );

      res.status(200).json({
        message: "Cập nhật giá thành công",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật giá:", error);
      res.status(500).json({ error: "Lỗi server khi cập nhật giá" });
    }
  };
};

module.exports = updateShowtimePrices;


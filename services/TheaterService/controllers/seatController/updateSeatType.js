module.exports = ({ pool }) => {
  return async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;

    if (!["vip", "regular"].includes(type)) {
      return res.status(400).json({
        error: "Loại ghế không hợp lệ. Chỉ chấp nhận 'vip' hoặc 'regular'",
      });
    }

    try {
      const result = await pool.query(
        `SELECT * FROM seats WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy ghế" });
      }

      await pool.query(
        `UPDATE seats SET type = $1 WHERE id = $2`,
        [type, id]
      );

      res.status(200).json({
        message: `Đã chuyển ghế sang loại '${type}'`,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật loại ghế:", error.message);
      res.status(500).json({ error: "Lỗi khi cập nhật loại ghế" });
    }
  };
};

module.exports = ({ pool }) => {
  return async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        error: "Trạng thái ghế không hợp lệ. Chỉ chấp nhận 'active' hoặc 'inactive'",
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
        `UPDATE seats SET status = $1 WHERE id = $2`,
        [status, id]
      );

      res.status(200).json({
        message: `Đã cập nhật trạng thái ghế thành '${status}'`,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái ghế:", error.message);
      res.status(500).json({ error: "Lỗi khi cập nhật trạng thái ghế" });
    }
  };
};

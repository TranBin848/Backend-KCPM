module.exports = ({ pool }) => {
  return async (req, res) => {
    const { room_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT * FROM seats WHERE room_id = $1 ORDER BY row_label, column_index`,
        [room_id]
      );

      res.status(200).json({ seats: result.rows });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách ghế:", error.message);
      res.status(500).json({ error: "Không thể lấy danh sách ghế" });
    }
  };
};
